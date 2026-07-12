import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { tools } from "./tools/index.ts";
import { runCommand } from "citty";
import { persistBrowser, closeBrowser } from "./lib/browser";
import pkg from "../package.json";

const server = new Server(
  {
    name: "monk-toolkit",
    version: pkg.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const mcpTools = tools
    .filter((t) => !["list", "describe"].includes(t.meta.name!))
    .map((t) => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const [key, arg] of Object.entries(t.args || {})) {
        properties[key] = {
          type: (arg as any).type === "boolean" ? "boolean" : "string",
          description: (arg as any).description || "",
        };

        if ((arg as any).default !== undefined) {
          properties[key].default = (arg as any).default;
        }

        if ((arg as any).required) {
          required.push(key);
        }
      }

      return {
        name: t.meta.name!,
        description: t.meta.description || "",
        inputSchema: {
          type: "object",
          properties,
          required,
        },
      };
    });

  return { tools: mcpTools };
});

// Tool calls run in-process; console.log capture is global state, so calls
// are serialized. Real stdout is the JSON-RPC channel — a stray console.log
// reaching it would corrupt framing.
let queue: Promise<unknown> = Promise.resolve();

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = tools.find((t) => t.meta.name === name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const positionalArgs: string[] = [];
  const flagArgs: string[] = [];

  if (args) {
    for (const [key, argDef] of Object.entries(tool.args || {})) {
      const val = args[key];
      if (val !== undefined && val !== null) {
        if ((argDef as any).type === "positional") {
          positionalArgs.push(String(val));
        } else if ((argDef as any).type === "boolean") {
          if (val) flagArgs.push(`--${key}`);
        } else {
          flagArgs.push(`--${key}=${val}`);
        }
      }
    }
  }

  const run = async () => {
    const lines: string[] = [];
    const realLog = console.log;
    console.log = (...a: unknown[]) => lines.push(a.join(" "));
    try {
      await runCommand(tool, { rawArgs: [...positionalArgs, ...flagArgs] });
      const out = lines.join("\n");

      if (name === "screenshot-url" && !args?.out) {
        return {
          content: [{ type: "image", data: out.trim(), mimeType: "image/png" }],
        };
      }

      return { content: [{ type: "text", text: out }] };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    } finally {
      console.log = realLog;
    }
  };

  return (queue = queue.then(run, run)) as any;
});

persistBrowser();
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    await closeBrowser(true);
    process.exit(0);
  });
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Monk MCP Server running on stdio");
