import { defineCommand } from "citty";
import { resolve } from "path";

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

    const rawArgs = (args as any)._ || [];
    rawArgs.forEach((f: string) => targetFiles.add(f));

    if (targetFiles.size === 0) {
      console.error("No files provided.");
      process.exit(1);
    }

    for (const filePath of targetFiles) {
      const file = Bun.file(filePath);
      
      if (!(await file.exists())) {
        console.log(`catfile ${filePath} (ERROR_FILE_NOT_FOUND)`);
        continue;
      }

      // Check if binary by looking for null bytes in the first 4KB
      let isBinary = false;
      try {
        const slice = file.slice(0, 4096);
        const buffer = new Uint8Array(await slice.arrayBuffer());
        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === 0) {
            isBinary = true;
            break;
          }
        }
      } catch (e) {
        console.log(`catfile ${filePath} (ERROR_FILE_UNREADABLE)`);
        continue;
      }

      if (isBinary) {
        console.log(`catfile ${filePath} (ERROR_FILE_NON_TEXT)`);
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
        const tokens = Math.ceil(file.size / 4);
        console.log(`catfile ${filePath} (${lines.length} LOC, ~${tokens} tokens)`);
        continue;
      }

      console.log(`catfile ${filePath} (${lines.length} LOC):\n${text}`);
    }
  },
});
