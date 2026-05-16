import { defineCommand } from "citty";
import treeCmd from "./tree";

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
    json: {
      type: "boolean",
      description: "Output JSON",
      default: false,
    },
  },
  async run({ args, cmd, data }) {
    // 1. Get the flat list of files via the tree logic to respect gitignores and blacklists
    const consoleLog = console.log;
    const files: string[] = [];
    
    // Intercept tree output
    console.log = (output) => {
      if (typeof output === "string" && output.startsWith("[")) {
        const parsed = JSON.parse(output);
        parsed.forEach((p: any) => files.push(p.path));
      }
    };
    
    await treeCmd.run({ args: { path: ".", json: true }, cmd, data });
    
    // Restore console.log
    console.log = consoleLog;

    const symbolName = args.name;
    
    // Dynamic Regex matching common definition keywords across Rust, TS, JS, Luau, C++
    const pattern = new RegExp(
      `\\b(class|struct|enum|interface|type|fn|function|trait|impl|let|const|var|#define)\\s+(?:[a-zA-Z0-9_<>\\[\\]\\s]*\\s+)?\\b${symbolName}\\b|\\b${symbolName}\\s*[:=]\\s*(?:function|\\()`,
      "i"
    );

    const results: { file: string; line: number; content: string }[] = [];

    for (const filePath of files) {
      try {
        const file = Bun.file(filePath);
        const text = await file.text();
        const lines = text.split("\n");
        
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            results.push({
              file: filePath,
              line: i + 1,
              content: lines[i].trim(),
            });
          }
        }
      } catch (e) {
        // Ignore read errors for inaccessible files
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
