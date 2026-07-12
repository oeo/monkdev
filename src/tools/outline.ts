import { defineCommand } from "citty";
import { existsSync } from "node:fs";

export default defineCommand({
  meta: {
    name: "outline",
    description: "Extract the structural outline (signatures, classes, structs) of a file, dropping implementation bodies to save tokens.",
  },
  args: {
    file: {
      type: "positional",
      description: "File to outline",
      required: true,
    },
    json: {
      type: "boolean",
      description: "Output JSON",
      default: false,
    },
  },
  async run({ args }) {
    const filePath = args.file;
    
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const text = await Bun.file(filePath).text();
    const lines = text.split("\n");
    const outline: { line: number; content: string }[] = [];
    
    // A broader regex to capture definitions, signatures, and module exports
    // This is a heuristic approach optimized for token savings, not a perfect AST
    const pattern = /^(?:export\s+|pub\s+|class\s+|struct\s+|enum\s+|interface\s+|type\s+|fn\s+|function\s+|def\s+|impl\s+|trait\s+|#define\s+|import\s+|from\s+|use\s+|require\()|^\s*[a-zA-Z0-9_]+\s*[:=]\s*(?:function|\([^)]*\)\s*=>)/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines, pure comments, and closing braces
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed === "}") {
        continue;
      }
      
      if (pattern.test(trimmed)) {
        outline.push({ line: i + 1, content: line });
      }
    }

    const isJson = args.json;

    if (isJson) {
      console.log(JSON.stringify(outline, null, 2));
    } else {
      console.log(`Outline for ${filePath} (${outline.length} lines):`);
      for (const item of outline) {
        console.log(`${String(item.line).padEnd(4)} | ${item.content}`);
      }
    }
  },
});
