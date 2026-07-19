import { defineCommand } from "citty";
import { isBinary } from "../lib/walk";

export default defineCommand({
  meta: {
    name: "catfiles",
    description: "Concatenate multiple files with LOC and path headers",
  },
  args: {
    files: {
      type: "string",
      description: "Comma-separated list of file paths (or pass as separate positional args in CLI)",
      required: false,
    },
    "stats-only": {
      type: "boolean",
      description: "Output only LOC and token estimates, not file content",
      default: false,
    },
  },
  async run({ args }) {
    const targetFiles: Set<string> = new Set();

    if (args.files) {
      args.files.split(",").forEach((f) => targetFiles.add(f.trim()));
    }

    // citty exposes unnamed positionals as `_` on the parsed args.
    const rawArgs = (args as { _?: string[] })._ ?? [];
    rawArgs.forEach((f) => targetFiles.add(f));

    if (targetFiles.size === 0) {
      throw new Error("No files provided.");
    }

    for (const filePath of targetFiles) {
      const file = Bun.file(filePath);
      
      if (!(await file.exists())) {
        console.log(`catfile ${filePath} (ERROR_FILE_NOT_FOUND)`);
        continue;
      }

      try {
        if (await isBinary(file)) {
          console.log(`catfile ${filePath} (ERROR_FILE_NON_TEXT)`);
          continue;
        }
      } catch (e) {
        console.log(`catfile ${filePath} (ERROR_FILE_UNREADABLE)`);
        continue;
      }

      let text: string;
      try {
        text = await file.text();
      } catch (e) {
        console.log(`catfile ${filePath} (ERROR_FILE_UNREADABLE)`);
        continue;
      }
      const lines = text.split("\n");

      if (lines.length > 5000) {
        console.log(`catfile ${filePath} (ERROR_FILE_TOO_LARGE)`);
        continue;
      }

      if (args["stats-only"]) {
        const tokens = Math.ceil(text.length / 4);
        console.log(`catfile ${filePath} (${lines.length} LOC, ~${tokens} tokens)`);
        continue;
      }

      console.log(`catfile ${filePath} (${lines.length} LOC):\n${text}`);
    }
  },
});
