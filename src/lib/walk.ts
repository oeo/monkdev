import ignore from "ignore";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { absoluteScore, scoreFile } from "./score";

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
  "pnpm-lock.yaml",
  ".cache",
  "target",
  ".next",
  ".svelte-kit",
  ".turbo",
  ".vite",
  // Python environments & tool caches
  "venv",
  ".venv",
  "site-packages",
  ".pytest_cache",
  ".mypy_cache",
  ".ruff_cache",
  ".tox",
  ".nox",
  ".eggs",
  "*.egg-info",
  ".ipynb_checkpoints",
  // JS package stores & framework caches
  "bower_components",
  "jspm_packages",
  ".pnpm-store",
  ".output",
  ".nuxt",
  ".astro",
  ".parcel-cache",
  ".sass-cache",
  ".angular",
  ".docusaurus",
  "storybook-static",
  ".vercel",
  ".netlify",
  ".wrangler",
  ".expo",
  ".firebase",
  ".serverless",
  // Native / mobile / infra
  "zig-cache",
  ".zig-cache",
  "zig-out",
  "cmake-build-*",
  "CMakeFiles",
  ".gradle",
  "Pods",
  "Carthage",
  ".dart_tool",
  ".terraform",
  ".vagrant",
  ".history",
  "_site",
  ".jekyll-cache",
  // Derived artifacts
  "*.min.js",
  "*.min.css",
  "*.js.map",
  "*.mjs.map",
  "*.cjs.map",
  "*.css.map",
  "*.tsbuildinfo",
  ".eslintcache",
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

export interface WalkResult {
  files: WalkEntry[];
  oversized: { path: string; bytes: number }[]; // skipped >500KB text-ish files, surfaced so stats never lie
}

export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

// Greedy score-descending pack (fewer tokens first within a score tier) that
// keeps taking files while they fit the budget. Used by tree/context max-tokens.
export function packFiles(files: WalkEntry[], maxTokens: number) {
  const ordered = [...files].sort((a, b) => b.score - a.score || a.text.length - b.text.length);
  const packed: WalkEntry[] = [];
  let used = 0;
  for (const f of ordered) {
    const t = estimateTokens(f.text);
    if (used + t > maxTokens) continue;
    packed.push(f);
    used += t;
  }
  return { packed, usedTokens: used, excluded: files.length - packed.length };
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
  } catch (e: any) {
    if (e.code !== "ENOENT") {
      console.error(`monk: cannot read ${join(dir, file)}: ${e.message}`);
    }
    return null;
  }
}

// Git semantics: matchers are ordered parent-first, and a deeper rule (including
// a `!` negation) overrides a shallower one. Within one file the `ignore`
// package already applies last-match-wins; across the chain we carry the state.
function matches(chain: Matcher[], absPath: string, isDir: boolean): boolean {
  let ignored = false;
  for (const m of chain) {
    const rel = relative(m.base, absPath);
    if (!rel || rel.startsWith("..")) continue;
    const file = m.ig.test(rel);
    const dir = isDir ? m.ig.test(rel + "/") : file;
    if (file.ignored || dir.ignored) ignored = true;
    else if (file.unignored || dir.unignored) ignored = false;
  }
  return ignored;
}

export async function isBinary(file: ReturnType<typeof Bun.file>): Promise<boolean> {
  const buffer = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  return buffer.includes(0);
}

// Recursively collect text files under targetDir, honoring .gitignore and the
// blacklist (fully omitted) and .monkignore (flagged, but still returned).
// Both ignore files are read at every directory level and inherited downward.
export async function collectFiles(targetDir: string): Promise<WalkResult> {
  const found: (WalkEntry & { raw: number; cap: number })[] = [];
  const oversized: { path: string; bytes: number }[] = [];
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
    } catch (e: any) {
      console.error(`monk: cannot read directory ${dir}: ${e.message}`);
      return;
    }

    // PEP 405 sentinel: a directory holding pyvenv.cfg is a virtualenv under any name.
    if (dir !== targetDir && entries.some((e) => e.name === "pyvenv.cfg")) return;

    const git = await loadMatcher(dir, ".gitignore");
    const monk = await loadMatcher(dir, ".monkignore");
    const gc = git ? [...gitChain, git] : gitChain;
    const mc = monk ? [...monkChain, monk] : monkChain;

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const isDir = entry.isDirectory();
      let isFile = entry.isFile();

      // Symlinked files resolve to their target; symlinked directories stay
      // skipped (cycle risk), matching git's blob-not-tree treatment.
      if (entry.isSymbolicLink()) {
        try {
          isFile = (await stat(fullPath)).isFile();
        } catch {
          continue; // broken symlink
        }
      }

      // Blacklist is checked apart from the gitignore chain so a user's `!`
      // negation can never resurrect node_modules and friends.
      if (matches([blacklist], fullPath, isDir)) continue;
      if (matches(gc, fullPath, isDir)) continue;
      const monkIgnored = inheritedMonk || matches(mc, fullPath, isDir);

      if (isDir) {
        await walk(fullPath, gc, mc, monkIgnored);
        continue;
      }
      if (!isFile) continue;

      const file = Bun.file(fullPath);
      if (file.size > MAX_FILE_SIZE) {
        oversized.push({ path: relative(targetDir, fullPath), bytes: file.size });
        continue;
      }

      try {
        if (await isBinary(file)) continue;
        const text = await file.text();
        const path = relative(targetDir, fullPath);
        const loc = text.split("\n").length;
        const { raw, cap } = scoreFile(path, loc, file.size, text.slice(0, 300));
        found.push({ path, loc, bytes: file.size, text, score: 0, raw, cap, monkIgnored });
      } catch (e: any) {
        console.error(`monk: skipped unreadable file ${fullPath}: ${e.message}`);
      }
    }
  }

  await walk(targetDir, [], [], false);

  // Map raw signal onto 1-10. The absolute scale saturates on large repos
  // (most src files land at 8+, min=10 matches nothing), so rank-percentile
  // demotes within saturated bands there — anchored so rank can never lift a
  // file more than one point above its absolute score (junk must not float to
  // 10 just because the repo is junk). Small repos keep the absolute mapping,
  // where "everything matters" is the truth.
  if (found.length >= 100) {
    const ranked = [...found].sort((a, b) => b.raw - a.raw);
    for (let i = 0; i < ranked.length; i++) {
      const tier = i > 0 && ranked[i].raw === ranked[i - 1].raw
        ? ranked[i - 1].score
        : 10 - Math.floor((i * 10) / ranked.length);
      ranked[i].score = Math.min(tier, absoluteScore(ranked[i].raw) + 1);
    }
  } else {
    for (const f of found) f.score = absoluteScore(f.raw);
  }
  for (const f of found) f.score = Math.max(1, Math.min(f.score, f.cap));

  // Byte-identical bodies: only the best-ranked copy keeps its score.
  found.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  const seen = new Set<ReturnType<typeof Bun.hash>>();
  for (const f of found) {
    const h = Bun.hash(f.text);
    if (seen.has(h)) f.score = 1;
    else seen.add(h);
  }

  found.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  oversized.sort((a, b) => b.bytes - a.bytes);
  return { files: found.map(({ raw, cap, ...entry }) => entry), oversized };
}
