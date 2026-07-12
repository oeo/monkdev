import { defineCommand } from "citty";
import { $ } from "bun";
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
    min: {
      type: "string",
      description: "Only pack files with importance score >= this (1-10)",
      required: false,
    },
    raw: {
      type: "boolean",
      description: "Skip the rtk minimal filter even when rtk is installed",
      default: false,
    },
  },
  async run({ args }) {
    const targetDir = args.path || ".";

    if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
      throw new Error(`Directory not found: ${targetDir}`);
    }

    // .monkignore entries fog general meditation; drop them from context.
    const min = args.min ? Number(args.min) : 0;
    const files = (await collectFiles(targetDir)).filter((f) => !f.monkIgnored && f.score >= min);

    // rtk (Rust Token Killer) strips comments and collapses blanks; a failed
    // filter falls back to the raw text so meditation never goes blind.
    const rtk = args.raw ? null : Bun.which("rtk");
    if (rtk) {
      for (const f of files) {
        const proc = await $`${rtk} read -l minimal ${join(targetDir, f.path)}`.quiet().nothrow();
        if (proc.exitCode === 0) f.text = proc.stdout.toString();
      }
    }
    const totalTokens = files.reduce((sum, f) => sum + Math.ceil(f.text.length / 4), 0);

    if (args["stats-only"]) {
      console.log(`Context Target: ${targetDir}`);
      console.log(`Files to pack: ${files.length}`);
      console.log(`Estimated Tokens: ~${totalTokens}${rtk ? " (rtk minimal filter active)" : ""}`);
      return;
    }

    if (files.length === 0) {
      console.log("No text files found to pack.");
      return;
    }

    let output = `<context directory="${targetDir}"${rtk ? ' filter="rtk-minimal"' : ""}>\n`;
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
