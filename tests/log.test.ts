import { test, expect } from "bun:test";
import { $ } from "bun";
import { existsSync } from "fs";

test("log manages TODO and CHANGELOG correctly", async () => {
  // Ensure clean state
  await $`rm -f TODO.md CHANGELOG.md`;

  // 1. Add Todo
  const { exitCode: code1 } = await $`./bin/monk log todo "Build symbol tool"`.quiet();
  expect(code1).toBe(0);
  expect(existsSync("TODO.md")).toBe(true);
  const todo1 = await Bun.file("TODO.md").text();
  expect(todo1).toContain("- [ ] Build symbol tool");

  // 2. Complete Todo
  const { exitCode: code2 } = await $`./bin/monk log done "symbol tool"`.quiet();
  expect(code2).toBe(0);
  const todo2 = await Bun.file("TODO.md").text();
  expect(todo2).toContain("- [x] Build symbol tool");

  // 3. Add Changelog
  const { exitCode: code3 } = await $`./bin/monk log changelog added "New symbol tool for cross-language search"`.quiet();
  expect(code3).toBe(0);
  expect(existsSync("CHANGELOG.md")).toBe(true);
  const cl = await Bun.file("CHANGELOG.md").text();
  expect(cl).toContain("## [Unreleased]");
  expect(cl).toContain("### Added");
  expect(cl).toContain("- New symbol tool for cross-language search");

  // Cleanup
  await $`rm -f TODO.md CHANGELOG.md`;
});
