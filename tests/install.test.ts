import { test, expect, beforeAll, afterAll } from "bun:test";
import { $ } from "bun";
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";

const D = `test_install_dir_${process.pid}`;
const BEGIN = "<!-- BEGIN MONK DIRECTIVES -->";
const END = "<!-- END MONK DIRECTIVES -->";

let fn: string;

beforeAll(async () => {
  // extract merge_directives verbatim; a rename or restructure fails loudly here
  fn = await $`sed -n '/^merge_directives()/,/^}/p' scripts/install.sh`.text();
  expect(fn).toContain("merge_directives()");
  await mkdir(D, { recursive: true });
  await writeFile(`${D}/CLAUDE.md`, "DIRECTIVES_V2\n");
});

afterAll(async () => {
  await rm(D, { recursive: true, force: true });
});

async function merge(target: string) {
  const script = [
    "set -euo pipefail",
    `DIR="${D}"`,
    `BEGIN="${BEGIN}"`,
    `END="${END}"`,
    fn,
    `merge_directives "${target}"`,
  ].join("\n");
  return await $`bash -c ${script}`.quiet().nothrow();
}

test("merge creates a missing target with markers", async () => {
  const t = `${D}/fresh.md`;
  const res = await merge(t);
  expect(res.exitCode).toBe(0);
  expect(await readFile(t, "utf8")).toBe(`${BEGIN}\nDIRECTIVES_V2\n${END}\n`);
});

test("merge appends to an existing file without markers, preserving content", async () => {
  const t = `${D}/plain.md`;
  await writeFile(t, "user content\n");
  const res = await merge(t);
  expect(res.exitCode).toBe(0);
  expect(await readFile(t, "utf8")).toBe(
    `user content\n\n${BEGIN}\nDIRECTIVES_V2\n${END}\n`,
  );
});

test("merge replaces the marker body, preserves outside content, idempotent", async () => {
  const t = `${D}/marked.md`;
  await writeFile(t, `above\n${BEGIN}\nOLD STUFF\n${END}\nbelow\n`);

  const res1 = await merge(t);
  expect(res1.exitCode).toBe(0);
  const out1 = await readFile(t, "utf8");
  expect(out1).toBe(`above\n${BEGIN}\nDIRECTIVES_V2\n${END}\nbelow\n`);

  const res2 = await merge(t);
  expect(res2.exitCode).toBe(0);
  expect(await readFile(t, "utf8")).toBe(out1);
});

test("merge aborts and leaves the file untouched when END marker is missing", async () => {
  const t = `${D}/corrupt.md`;
  const before = `above\n${BEGIN}\nstuff\n`;
  await writeFile(t, before);
  const res = await merge(t);
  expect(res.exitCode).not.toBe(0);
  expect(res.stderr.toString()).toContain("no END marker");
  expect(await readFile(t, "utf8")).toBe(before);
});
