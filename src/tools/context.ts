import { defineCommand } from "citty";
import { $ } from "bun";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { collectFiles, estimateTokens, packFiles } from "../lib/walk";

const CONTEXT_BUDGET = 150_000; // tokens a meditation can realistically fit

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
    "max-tokens": {
      type: "string",
      description: "Pack only the top-scored files fitting ~N tokens",
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
    const { files: walked, oversized } = await collectFiles(targetDir);
    const visible = walked.filter((f) => !f.monkIgnored);
    const min = args.min ? Number(args.min) : 0;
    let files = visible.filter((f) => f.score >= min);

    const budget = args["max-tokens"] ? Number(args["max-tokens"]) : 0;
    let excluded = 0;
    if (budget > 0) {
      const pack = packFiles(files, budget);
      files = pack.packed;
      excluded = pack.excluded;
    }

    // rtk (Rust Token Killer) strips comments and collapses blanks; a failed
    // filter falls back to the raw text so meditation never goes blind.
    const rtk = args.raw ? null : Bun.which("rtk");
    if (rtk) {
      for (const f of files) {
        const proc = await $`${rtk} read -l minimal ${join(targetDir, f.path)}`.quiet().nothrow();
        if (proc.exitCode === 0) f.text = proc.stdout.toString();
      }
    }
    const totalTokens = files.reduce((sum, f) => sum + estimateTokens(f.text), 0);

    if (args["stats-only"]) {
      console.log(`Context Target: ${targetDir}`);
      console.log(`Files to pack: ${files.length}`);
      console.log(`Estimated Tokens: ~${totalTokens}${rtk ? " (rtk minimal filter active)" : ""}`);

      // Cumulative histogram + the largest min that fits a meditation budget.
      console.log("\nmin | files | ~tokens (cumulative)");
      let fit = 0;
      let cumFiles = 0;
      let cumTokens = 0;
      for (let m = 10; m >= 1; m--) {
        const bucket = visible.filter((f) => f.score === m);
        cumFiles += bucket.length;
        cumTokens += bucket.reduce((sum, f) => sum + estimateTokens(f.text), 0);
        if (cumTokens <= CONTEXT_BUDGET && cumFiles > 0) fit = m;
        console.log(`${String(m).padStart(3)} | ${String(cumFiles).padStart(5)} | ~${cumTokens}`);
      }
      if (fit) console.log(`\nFits ~${CONTEXT_BUDGET} tokens at min=${fit}`);
      else console.log(`\nNo min threshold fits ~${CONTEXT_BUDGET} tokens; use max-tokens=${CONTEXT_BUDGET}`);
      if (oversized.length) {
        console.log(`warning: ${oversized.length} files >500KB skipped (largest: ${oversized[0].path} ${(oversized[0].bytes / 1024 / 1024).toFixed(1)}MB)`);
      }
      return;
    }

    if (files.length === 0) {
      console.log("No text files found to pack.");
      return;
    }

    let output = `<context directory="${targetDir}"${rtk ? ' filter="rtk-minimal"' : ""}>\n`;
    // Byte-identical bodies collapse into a stub pointing at the first copy.
    const seen = new Map<ReturnType<typeof Bun.hash>, string>();
    for (const f of files) {
      const hash = Bun.hash(f.text);
      const first = seen.get(hash);
      if (first !== undefined) {
        output += `  <file path="${f.path}" duplicateOf="${first}"/>\n`;
        continue;
      }
      seen.set(hash, f.path);
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

    const packNote = budget > 0 ? `, max-tokens=${budget} excluded ${excluded} files` : "";
    if (outPath) {
      await Bun.write(outPath, output);
      console.log(`Context successfully written to ${outPath} (${files.length} files, ~${totalTokens} tokens${packNote}).`);
    } else {
      console.log(output);
    }
  },
});
