import { test, expect } from "bun:test";
import { $ } from "bun";
import { rm, writeFile } from "node:fs/promises";

test("outline extracts signatures correctly", async () => {
  const code = `
import fs from "fs";
export class MyClass {
  // some comment
  private doThing() {
    console.log("body");
    return true;
  }
}
export function myFunc() {
  let a = 1;
}
  `;
  await writeFile("test_outline.ts", code);

  const { stdout } = await $`./bin/monk outline test_outline.ts --json`.quiet();
  const res = JSON.parse(stdout.toString());
  
  // Should keep imports, classes, and functions. Should drop bodies and comments.
  expect(res.some((r: any) => r.content.includes("import fs"))).toBe(true);
  expect(res.some((r: any) => r.content.includes("export class MyClass"))).toBe(true);
  expect(res.some((r: any) => r.content.includes("export function myFunc"))).toBe(true);
  expect(res.some((r: any) => r.content.includes("console.log"))).toBe(false);

  await rm("test_outline.ts", { force: true });
});
