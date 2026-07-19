import { test, expect } from "bun:test";
import { $ } from "bun";
import { mkdir, rm, writeFile } from "node:fs/promises";

const D = "test_monkignore_dir";

test("recursive .gitignore (anchored) and .monkignore semantics", async () => {
  await rm(D, { recursive: true, force: true });
  await mkdir(`${D}/sub`, { recursive: true });
  await mkdir(`${D}/vendor`, { recursive: true });

  // root .gitignore: glob (non-anchored)
  await writeFile(`${D}/.gitignore`, "*.log\n");
  // nested .gitignore: anchored pattern + negation overriding the parent glob
  await writeFile(`${D}/sub/.gitignore`, "/local.txt\n!keep.log\n");
  // .monkignore: omitted from context, but visible (marked) in tree
  await writeFile(`${D}/.monkignore`, "vendor/\n");

  await writeFile(`${D}/main.ts`, "export const x = 1;");
  await writeFile(`${D}/app.log`, "noise");
  await writeFile(`${D}/sub/keep.ts`, "export const y = 2;");
  await writeFile(`${D}/sub/local.txt`, "anchored ignore");
  await writeFile(`${D}/sub/keep.log`, "negation resurrects");
  await writeFile(`${D}/vendor/lib.ts`, "export const z = 3;");

  // --- tree ---
  const { stdout: treeOut } = await $`./bin/monk tree ${D} --json`.quiet();
  const tree = JSON.parse(treeOut.toString());
  const byPath = (p: string) => tree.find((f: any) => f.path === p);

  expect(byPath("main.ts")).toBeDefined();
  expect(byPath("sub/keep.ts")).toBeDefined();
  // gitignore omits entirely
  expect(byPath("app.log")).toBeUndefined();
  // anchored nested gitignore now resolves correctly
  expect(byPath("sub/local.txt")).toBeUndefined();
  // deeper !negation overrides the parent *.log glob, matching git
  expect(byPath("sub/keep.log")).toBeDefined();
  // monkignore is visible in tree, but flagged
  expect(byPath("vendor/lib.ts")).toBeDefined();
  expect(byPath("vendor/lib.ts").monkOmit).toBe(true);
  expect(byPath("main.ts").monkOmit).toBe(false);

  // --- context ---
  const { stdout: ctxOut } = await $`./bin/monk context ${D}`.quiet();
  const ctx = ctxOut.toString();
  expect(ctx).toContain('<file path="main.ts">');
  expect(ctx).toContain('<file path="sub/keep.ts">');
  expect(ctx).not.toContain('<file path="app.log">');
  // anchored nested gitignore: file omitted (its content must be absent)
  expect(ctx).not.toContain('<file path="sub/local.txt">');
  expect(ctx).not.toContain("anchored ignore");
  // monkignored content must not fog general meditation
  expect(ctx).not.toContain('<file path="vendor/lib.ts">');
  expect(ctx).not.toContain("export const z = 3;");

  // --- context targeting the monkignored folder directly still works ---
  const { stdout: vendorOut } = await $`./bin/monk context ${D}/vendor`.quiet();
  expect(vendorOut.toString()).toContain('<file path="lib.ts">');

  await rm(D, { recursive: true, force: true });
});
