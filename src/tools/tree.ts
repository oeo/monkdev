import { defineCommand } from "citty";
import { collectFiles, estimateTokens, packFiles } from "../lib/walk";

export default defineCommand({
  meta: {
    name: "tree",
    description: "Output a flat, filtered list of project files with LOC, ranked by heuristic importance, for meditative targeting.",
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
    min: {
      type: "string",
      description: "Only show files with importance score >= this (1-10)",
      required: false,
    },
    "max-tokens": {
      type: "string",
      description: "Keep only the top-scored files fitting ~N tokens",
      required: false,
    },
  },
  async run({ args }) {
    const targetDir = args.path || ".";
    const { files: all, oversized } = await collectFiles(targetDir);

    const min = args.min ? Number(args.min) : 0;
    if (Number.isNaN(min)) throw new Error(`Invalid --min: ${args.min}`);
    let files = all.filter((f) => f.score >= min);

    const budget = args["max-tokens"] ? Number(args["max-tokens"]) : 0;
    if (Number.isNaN(budget)) throw new Error(`Invalid --max-tokens: ${args["max-tokens"]}`);
    let excluded = 0;
    if (budget > 0) {
      const pack = packFiles(files, budget);
      files = pack.packed;
      excluded = pack.excluded;
    }

    const oversizedWarning = oversized.length
      ? `warning: ${oversized.length} files >500KB skipped (largest: ${oversized[0].path} ${(oversized[0].bytes / 1024 / 1024).toFixed(1)}MB)`
      : "";

    if (args.json) {
      if (oversizedWarning) console.error(oversizedWarning);
      console.log(
        JSON.stringify(
          files.map((f) => ({ score: f.score, loc: f.loc, tokens: estimateTokens(f.text), path: f.path, monkOmit: f.monkIgnored })),
          null,
          2,
        ),
      );
      return;
    }

    console.log("SCORE | LOC   | ~TOK  | Path");
    console.log("-------------------------------------------");
    for (const f of files) {
      const tag = f.monkIgnored ? "  (monk-omit)" : "";
      console.log(`${String(f.score).padEnd(5)} | ${String(f.loc).padEnd(5)} | ${String(estimateTokens(f.text)).padEnd(5)} | ${f.path}${tag}`);
    }

    // Cumulative histogram over the unfiltered walk, so the operator can pick
    // a feasible min threshold without a second stats round-trip. monk-omit
    // files are excluded so the numbers match what context would pack.
    console.log("\nmin | files | ~tokens (cumulative)");
    let cumFiles = 0;
    let cumTokens = 0;
    for (let m = 10; m >= 1; m--) {
      const bucket = all.filter((f) => !f.monkIgnored && f.score === m);
      cumFiles += bucket.length;
      cumTokens += bucket.reduce((sum, f) => sum + estimateTokens(f.text), 0);
      console.log(`${String(m).padStart(3)} | ${String(cumFiles).padStart(5)} | ~${cumTokens}`);
    }

    const total = files.reduce((sum, f) => sum + estimateTokens(f.text), 0);
    const packNote = budget > 0 ? ` (max-tokens=${budget}: excluded ${excluded} files)` : "";
    console.log(`\n${files.length} files, ~${total} tokens${min ? ` at min=${min}` : ""}${packNote}`);
    if (oversizedWarning) console.log(oversizedWarning);
  },
});
