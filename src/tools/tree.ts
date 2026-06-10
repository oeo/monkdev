import { defineCommand } from "citty";
import { collectFiles } from "../lib/walk";

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
    const files = await collectFiles(targetDir);

    if (args.json) {
      console.log(
        JSON.stringify(
          files.map((f) => ({ loc: f.loc, path: f.path, monkOmit: f.monkIgnored })),
          null,
          2,
        ),
      );
      return;
    }

    console.log("LOC   | Path");
    console.log("-----------------------------------");
    for (const f of files) {
      const tag = f.monkIgnored ? "  (monk-omit)" : "";
      console.log(`${String(f.loc).padEnd(5)} | ${f.path}${tag}`);
    }
  },
});
