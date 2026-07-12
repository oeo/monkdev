import { defineCommand } from "citty";
import { tools } from "./index";

export default defineCommand({
  meta: {
    name: "describe",
    description: "Describe a tool's args and usage",
  },
  args: {
    tool: { type: "positional", description: "Tool name", required: true },
    json: { type: "boolean", default: false },
  },
  run({ args }) {
    const t = tools.find((x) => x.meta.name === args.tool);
    if (!t) {
      throw new Error(`Unknown tool: ${args.tool}`);
    }

    const isJson = args.json;
    const info = {
      name: t.meta.name,
      description: t.meta.description,
      args: t.args ?? {},
    };

    if (isJson) {
      console.log(JSON.stringify(info, null, 2));
    } else {
      console.log(`${info.name} — ${info.description}\n`);
      console.log("Args:");
      for (const [k, v] of Object.entries(info.args)) {
        const def = (v as any).default !== undefined ? ` (default: ${(v as any).default})` : "";
        const req = (v as any).required ? " [required]" : "";
        console.log(`  --${k.padEnd(12)} ${(v as any).description ?? ""}${def}${req}`);
      }
    }
  },
});
