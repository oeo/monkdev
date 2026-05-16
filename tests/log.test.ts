import { test, expect } from "bun:test";
import { $ } from "bun";
import { existsSync } from "fs";

test("log manages TODO correctly", async () => {
  // Ensure clean state
  await $`rm -f TODO.md`.quiet();

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

  // Cleanup
  await $`rm -f TODO.md`.quiet();
});
