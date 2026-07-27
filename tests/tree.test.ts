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

test("tree ranks files by importance, source above tests", async () => {
  const { stdout } = await $`./bin/monk tree --json`.quiet();
  const data = JSON.parse(stdout.toString());

  // Sorted by score, descending
  const scores = data.map((f: any) => f.score);
  expect([...scores].sort((a, b) => b - a)).toEqual(scores);

  // Entry point outranks a test file
  const idx = (p: string) => data.findIndex((f: any) => f.path === p);
  expect(idx("src/cli.ts")).toBeLessThan(idx("tests/tree.test.ts"));
});

test("tree --min filters and --max-tokens packs with exclusion note", async () => {
  const { stdout: fullOut } = await $`./bin/monk tree --json`.quiet();
  const full = JSON.parse(fullOut.toString());
  const top = Math.max(...full.map((f: any) => f.score));

  const { stdout: minOut } = await $`./bin/monk tree --json --min ${top}`.quiet();
  const filtered = JSON.parse(minOut.toString());
  expect(filtered.length).toBeGreaterThan(0);
  expect(filtered.length).toBeLessThan(full.length);
  expect(filtered.every((f: any) => f.score >= top)).toBe(true);

  const { stdout: packOut } = await $`./bin/monk tree --max-tokens 50`.quiet();
  expect(packOut.toString()).toContain("excluded");
});

test("tree prints the cumulative histogram footer", async () => {
  const { stdout } = await $`./bin/monk tree`.quiet();
  expect(stdout.toString()).toContain("min | files | ~tokens (cumulative)");
});
