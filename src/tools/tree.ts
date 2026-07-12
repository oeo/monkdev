import { defineCommand } from "citty";
import { collectFiles } from "../lib/walk";

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
  },
  async run({ args }) {
    const targetDir = args.path || ".";
    const min = args.min ? Number(args.min) : 0;
    const files = (await collectFiles(targetDir)).filter((f) => f.score >= min);

    const tokens = (f: { text: string }) => Math.ceil(f.text.length / 4);

    if (args.json) {
      console.log(
        JSON.stringify(
          files.map((f) => ({ score: f.score, loc: f.loc, tokens: tokens(f), path: f.path, monkOmit: f.monkIgnored })),
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
      console.log(`${String(f.score).padEnd(5)} | ${String(f.loc).padEnd(5)} | ${String(tokens(f)).padEnd(5)} | ${f.path}${tag}`);
    }
    const total = files.reduce((sum, f) => sum + tokens(f), 0);
    console.log(`\n${files.length} files, ~${total} tokens${min ? ` at min=${min}` : ""}`);
  },
});
