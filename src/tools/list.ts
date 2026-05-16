import { defineCommand } from "citty";
import { tools } from "./index";

export default defineCommand({
  meta: {
    name: "list",
    description: "List all tools (JSON-friendly)",
  },
  args: {
    json: { type: "boolean", default: false },
  },
  run({ args }) {
    const isJson = args.json || !process.stdout.isTTY;
    const data = tools
      .filter((t) => !["list", "describe"].includes(t.meta.name!))
      .map((t) => ({
        name: t.meta.name,
        description: t.meta.description,
      }));

    if (isJson) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      for (const t of data) {
        console.log(`${t.name!.padEnd(18)} ${t.description}`);
      }
    }
  },
});
