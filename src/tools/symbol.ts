import { defineCommand } from "citty";
import { resolve } from "node:path";
import { collectFiles } from "../lib/walk";

export default defineCommand({
  meta: {
    name: "symbol",
    description: "Search for cross-language symbol definitions (classes, functions, structs, etc) across the project.",
  },
  args: {
    name: {
      type: "positional",
      description: "The name of the symbol to find",
      required: true,
    },
    path: {
      type: "string",
      description: "Directory to search (default: current working directory)",
      default: ".",
    },
    json: {
      type: "boolean",
      description: "Output JSON",
      default: false,
    },
  },
  async run({ args }) {
    const targetDir = resolve(args.path || ".");
    const symbolName = args.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Dynamic Regex matching common definition keywords across Rust, TS, JS, Luau, C++
    const pattern = new RegExp(
      `\\b(class|struct|enum|interface|type|fn|function|trait|impl|let|const|var|#define)\\s+(?:[a-zA-Z0-9_<>\\[\\]\\s]*\\s+)?\\b${symbolName}\\b|\\b${symbolName}\\s*[:=]\\s*(?:function|\\()`,
    );

    const results: { file: string; line: number; content: string }[] = [];

    for (const f of (await collectFiles(targetDir)).files) {
      const lines = f.text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          results.push({
            file: resolve(targetDir, f.path),
            line: i + 1,
            content: lines[i].trim(),
          });
        }
      }
    }

    if (args.json || !process.stdout.isTTY) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      if (results.length === 0) {
        console.log(`No definitions found for symbol: '${symbolName}'`);
        return;
      }
      for (const res of results) {
        console.log(`[${res.file}:${res.line}] -> ${res.content}`);
      }
    }
  },
});
