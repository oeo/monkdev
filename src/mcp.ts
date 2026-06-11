import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { tools } from "./tools/index.ts";
import { $ } from "bun";
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

  try {
    const MONK_BIN = require("node:path").join(import.meta.dir, "../bin/monk");
    // Array expansion in Bun ensures clean parameter passing
    const cmdArgs = [name, ...positionalArgs, ...flagArgs];
    const { stdout, stderr, exitCode } = await $`${MONK_BIN} ${cmdArgs}`.quiet();
    
    if (exitCode !== 0) {
      return {
        content: [{ type: "text", text: `Error:\n${stderr.toString()}` }],
        isError: true,
      };
    }

    if (name === "screenshot-url" && !args?.out) {
      return {
        content: [
          { type: "image", data: stdout.toString().trim(), mimeType: "image/png" },
        ],
      };
    }

    return {
      content: [{ type: "text", text: stdout.toString() }],
    };
  } catch (err: any) {
    return {
      content: [{ type: "text", text: `Execution failed: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Monk MCP Server running on stdio");
