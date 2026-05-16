import { defineCommand } from "citty";
import ignore from "ignore";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { existsSync, statSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";

const MONK_BLACKLIST = [
  ".git", "node_modules", "dist", "build", "__pycache__",
  ".DS_Store", "coverage", "*.lock", "package-lock.json", ".cache",
];

const MAX_FILE_SIZE = 500 * 1024; // 500KB

export default defineCommand({
  meta: {
    name: "context",
    description: "Pack an entire directory into an LLM-friendly XML block.",
  },
  args: {
    path: {
      type: "positional",
      description: "Directory to pack",
      required: false,
      default: ".",
    },
    "stats-only": {
      type: "boolean",
      description: "Output only LOC and token estimates, not file content",
      default: false,
    },
    out: {
      type: "string",
      description: "Optional file path to write the XML output to. Use 'auto' to auto-generate a unique temp file.",
      required: false,
    },
  },
  async run({ args }) {
    const targetDir = args.path || ".";
    
    if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
      console.error(`Directory not found: ${targetDir}`);
      process.exit(1);
    }

    const ig = ignore().add(MONK_BLACKLIST);

    try {
      const gitignorePath = join(targetDir, ".gitignore");
      const gitignoreContent = await readFile(gitignorePath, "utf8");
      ig.add(gitignoreContent);
    } catch (e) {}

    let totalTokens = 0;
    let totalFiles = 0;
    const filesToPack: { path: string; text: string; loc: number }[] = [];

    async function walk(dir: string) {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch (e) {
        return;
      }

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = relative(targetDir, fullPath);

        if (ig.ignores(relPath) || ig.ignores(relPath + (entry.isDirectory() ? "/" : ""))) {
          continue;
        }

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const file = Bun.file(fullPath);
          const size = file.size;

          if (size > MAX_FILE_SIZE) continue;

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
            continue;
          }

          if (isBinary) continue;

          try {
            const text = await file.text();
            const loc = text.split("\n").length;
            const approxTokens = Math.ceil(size / 4);

            totalTokens += approxTokens;
            totalFiles++;

            if (!args["stats-only"]) {
              filesToPack.push({ path: relPath, text, loc });
            }
          } catch (e) {
            // Ignore unreadable files
          }
        }
      }
    }

    await walk(targetDir);

    if (args["stats-only"]) {
      console.log(`Context Target: ${targetDir}`);
      console.log(`Files to pack: ${totalFiles}`);
      console.log(`Estimated Tokens: ~${totalTokens}`);
      return;
    }

    if (filesToPack.length === 0) {
      console.log("No text files found to pack.");
      return;
    }

    // Sort alphabetically for consistency
    filesToPack.sort((a, b) => a.path.localeCompare(b.path));

    let output = `<context directory="${targetDir}">\n`;
    for (const f of filesToPack) {
      output += `  <file path="${f.path}">\n${f.text}\n  </file>\n`;
    }
    output += `</context>`;

    let outPath = args.out;
    if (outPath === "auto") {
      outPath = join(tmpdir(), `monk-context-${randomUUID()}.xml`);
    }

    if (outPath) {
      await Bun.write(outPath, output);
      console.log(`Context successfully written to ${outPath} (${totalFiles} files, ~${totalTokens} tokens).`);
    } else {
      console.log(output);
    }
  },
});
