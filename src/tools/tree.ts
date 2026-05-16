import { defineCommand } from "citty";
import ignore from "ignore";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const MONK_BLACKLIST = [
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
];

const MAX_FILE_SIZE = 500 * 1024; // 500KB

export default defineCommand({
  meta: {
    name: "tree",
    description: "Output a flat, filtered list of project files with their LOC for meditative targeting.",
  },
  args: {
    path: {
      type: "positional",
      description: "Directory to scan",
      required: false,
      default: ".",
    },
    json: {
      type: "boolean",
      description: "Output JSON",
      default: false,
    },
  },
  async run({ args }) {
    const targetDir = args.path || ".";
    const ig = ignore().add(MONK_BLACKLIST);

    // Try to load .gitignore
    try {
      const gitignorePath = join(targetDir, ".gitignore");
      const gitignoreContent = await readFile(gitignorePath, "utf8");
      ig.add(gitignoreContent);
    } catch (e) {
      // It's okay if .gitignore doesn't exist
    }

    const results: { loc: number; path: string }[] = [];

    async function walk(dir: string) {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch (e) {
        return; // Ignore inaccessible directories
      }

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = relative(targetDir, fullPath);

        // Filter via ignore package
        if (ig.ignores(relPath) || ig.ignores(relPath + (entry.isDirectory() ? "/" : ""))) {
          continue;
        }

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const file = Bun.file(fullPath);
          const size = file.size;

          if (size > MAX_FILE_SIZE) {
            continue; // Skip heavily bloated files
          }

          // Read first 4KB to check for null bytes (identifies binaries)
          let isBinary = false;
          try {
            const slice = file.slice(0, 4096);
            const buffer = new Uint8Array(await slice.arrayBuffer());
            for (let i = 0; i < buffer.length; i++) {
              if (buffer[i] === 0) {
                isBinary = true;
                break;
              }
            }
          } catch (e) {
            continue; // Skip inaccessible files like broken symlinks
          }

          if (isBinary) {
            continue;
          }

          try {
            const text = await file.text();
            const loc = text.split("\n").length;
            results.push({ loc, path: relPath });
          } catch (e) {
            // Skip files that error on read
          }
        }
      }
    }

    await walk(targetDir);

    // Sort alphabetically for clean domain grouping
    results.sort((a, b) => a.path.localeCompare(b.path));

    const isJson = args.json;

    if (isJson) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log("LOC   | Path");
      console.log("-----------------------------------");
      for (const res of results) {
        console.log(`${String(res.loc).padEnd(5)} | ${res.path}`);
      }
    }
  },
});
