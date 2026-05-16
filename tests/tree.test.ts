import { test, expect } from "bun:test";
import { $ } from "bun";

test("tree outputs structured list excluding blacklist", async () => {
  const { stdout } = await $`./bin/monk tree --json`.quiet();
  const data = JSON.parse(stdout.toString());
  
  expect(Array.isArray(data)).toBe(true);
  
  // It should find common files like package.json
  expect(data.some((f: any) => f.path === "package.json")).toBe(true);
  expect(data.some((f: any) => f.path === "src/cli.ts")).toBe(true);

  // It should NOT find node_modules or .git directory
  expect(data.some((f: any) => f.path.startsWith("node_modules/"))).toBe(false);
  expect(data.some((f: any) => f.path.startsWith(".git/"))).toBe(false);
});
