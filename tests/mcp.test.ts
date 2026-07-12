import { test, expect, beforeAll, afterAll } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "node:path";

let client: Client;

beforeAll(async () => {
  client = new Client({ name: "monk-test", version: "0.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: resolve(import.meta.dir, "../bin/monk-mcp"),
      cwd: resolve(import.meta.dir, ".."),
    }),
  );
});

afterAll(async () => {
  await client.close();
});

test("mcp lists tools, excluding list/describe", async () => {
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name);
  expect(names).toContain("tree");
  expect(names).not.toContain("list");
  expect(names).not.toContain("describe");
});

test("mcp dispatches tree in-process with defaults applied", async () => {
  const res: any = await client.callTool({ name: "tree", arguments: { json: true } });
  const data = JSON.parse(res.content[0].text);
  expect(data.some((f: any) => f.path === "package.json")).toBe(true);
});

test("mcp survives a thrown tool error", async () => {
  const bad: any = await client.callTool({
    name: "outline",
    arguments: { file: "does-not-exist.xyz" },
  });
  expect(bad.isError).toBe(true);
  expect(bad.content[0].text).toContain("File not found");

  // Server must still answer after the error
  const ok: any = await client.callTool({ name: "tree", arguments: { json: true } });
  expect(JSON.parse(ok.content[0].text).length).toBeGreaterThan(0);
});
