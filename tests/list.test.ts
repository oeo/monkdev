import { test, expect } from "bun:test";
import { $ } from "bun";

test("list tool outputs JSON correctly", async () => {
  const { stdout } = await $`./bin/monk list --json`.quiet();
  const data = JSON.parse(stdout.toString());
  
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
  expect(data.some((t: any) => t.name === "fetch-url")).toBe(true);
  expect(data.some((t: any) => t.name === "brave-search")).toBe(true);
});
