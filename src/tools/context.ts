import { defineCommand } from "citty";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { collectFiles } from "../lib/walk";

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

    // .monkignore entries fog general meditation; drop them from context.
    const files = (await collectFiles(targetDir)).filter((f) => !f.monkIgnored);
    const totalTokens = files.reduce((sum, f) => sum + Math.ceil(f.bytes / 4), 0);

    if (args["stats-only"]) {
      console.log(`Context Target: ${targetDir}`);
      console.log(`Files to pack: ${files.length}`);
      console.log(`Estimated Tokens: ~${totalTokens}`);
      return;
    }

    if (files.length === 0) {
      console.log("No text files found to pack.");
      return;
    }

    let output = `<context directory="${targetDir}">\n`;
    for (const f of files) {
      output += `  <file path="${f.path}">\n${f.text}\n  </file>\n`;
    }
    output += `</context>`;

    let outPath = args.out;
    if (!outPath && totalTokens > 10000) {
      outPath = "auto";
    }
    if (outPath === "auto") {
      outPath = join(tmpdir(), `monk-context-${randomUUID()}.xml`);
    }

    if (outPath) {
      await Bun.write(outPath, output);
      console.log(`Context successfully written to ${outPath} (${files.length} files, ~${totalTokens} tokens).`);
    } else {
      console.log(output);
    }
  },
});
