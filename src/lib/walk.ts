import ignore from "ignore";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { scoreFile } from "./score";

export const MONK_BLACKLIST = [
  ".git",
  "node_modules",
  "dist",
  "build",
  "__pycache__",
  ".DS_Store",
  "coverage",
  "*.lock",
  "package-lock.json",
  ".cache",
  "target",
  ".next",
  ".svelte-kit",
  ".turbo",
  ".vite",
];

const MAX_FILE_SIZE = 500 * 1024; // 500KB

export interface WalkEntry {
  path: string; // relative to the scanned root
  loc: number;
  bytes: number;
  text: string;
  score: number; // heuristic importance, higher = more important
  monkIgnored: boolean; // matched a .monkignore rule: visible in tree, omitted from context
}

// An ignore matcher rooted at the directory its rules were declared in.
// Paths must be tested relative to `base` so that anchored patterns (e.g. /local)
// resolve correctly at any depth.
interface Matcher {
  base: string;
  ig: ReturnType<typeof ignore>;
}

async function loadMatcher(dir: string, file: string): Promise<Matcher | null> {
  try {
    const content = await readFile(join(dir, file), "utf8");
    return { base: dir, ig: ignore().add(content) };
  } catch {
    return null;
  }
}

function matches(chain: Matcher[], absPath: string, isDir: boolean): boolean {
  for (const m of chain) {
    const rel = relative(m.base, absPath);
    if (!rel || rel.startsWith("..")) continue;
    if (m.ig.ignores(rel) || (isDir && m.ig.ignores(rel + "/"))) return true;
  }
  return false;
}

async function isBinary(file: ReturnType<typeof Bun.file>): Promise<boolean> {
  const buffer = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  return buffer.includes(0);
}

// Recursively collect text files under targetDir, honoring .gitignore and the
// blacklist (fully omitted) and .monkignore (flagged, but still returned).
// Both ignore files are read at every directory level and inherited downward.
export async function collectFiles(targetDir: string): Promise<WalkEntry[]> {
  const out: WalkEntry[] = [];
  const blacklist: Matcher = { base: targetDir, ig: ignore().add(MONK_BLACKLIST) };

  async function walk(
    dir: string,
    gitChain: Matcher[],
    monkChain: Matcher[],
    inheritedMonk: boolean,
  ) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return; // unreadable directory
    }

    const git = await loadMatcher(dir, ".gitignore");
    const monk = await loadMatcher(dir, ".monkignore");
    const gc = git ? [...gitChain, git] : gitChain;
    const mc = monk ? [...monkChain, monk] : monkChain;

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const isDir = entry.isDirectory();

      if (matches(gc, fullPath, isDir)) continue; // fully omitted everywhere
      const monkIgnored = inheritedMonk || matches(mc, fullPath, isDir);

      if (isDir) {
        await walk(fullPath, gc, mc, monkIgnored);
        continue;
      }
      if (!entry.isFile()) continue;

      const file = Bun.file(fullPath);
      if (file.size > MAX_FILE_SIZE) continue;

      try {
        if (await isBinary(file)) continue;
        const text = await file.text();
        const path = relative(targetDir, fullPath);
        const loc = text.split("\n").length;
        out.push({
          path,
          loc,
          bytes: file.size,
          text,
          score: scoreFile(path, loc),
          monkIgnored,
        });
      } catch {
        // skip unreadable file
      }
    }
  }

  await walk(targetDir, [blacklist], [], false);
  out.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  return out;
}
