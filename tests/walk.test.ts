import { test, expect } from "bun:test";
import { $ } from "bun";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { countLines } from "../src/lib/walk";

const D = `test_walk_dir_${process.pid}`;

test("countLines does not count a trailing newline as a line", () => {
  expect(countLines("")).toBe(0);
  expect(countLines("a")).toBe(1);
  expect(countLines("a\n")).toBe(1);
  expect(countLines("a\nb")).toBe(2);
  expect(countLines("a\nb\n")).toBe(2);
});

test("tree skips oversized files, pyvenv dirs, and demotes duplicates", async () => {
  await rm(D, { recursive: true, force: true });
  await mkdir(`${D}/venv-like`, { recursive: true });
  await writeFile(`${D}/big.txt`, "x".repeat(501 * 1024));
  await writeFile(`${D}/venv-like/pyvenv.cfg`, "home = /usr\n");
  await writeFile(`${D}/venv-like/lib.py`, "x = 1\n");
  await writeFile(`${D}/dup1.ts`, "export const same = 1;\n");
  await writeFile(`${D}/dup2.ts`, "export const same = 1;\n");
  await writeFile(`${D}/main.ts`, "export const unique = 2;\n");

  try {
    const proc = await $`./bin/monk tree ${D} --json`.quiet();
    const data = JSON.parse(proc.stdout.toString());
    const paths = data.map((f: any) => f.path);

    // >500KB skipped and surfaced as a warning
    expect(paths).not.toContain("big.txt");
    expect(proc.stderr.toString()).toContain("1 files >500KB skipped");

    // a pyvenv.cfg directory is skipped entirely
    expect(paths).not.toContain("venv-like/lib.py");
    expect(paths).not.toContain("venv-like/pyvenv.cfg");

    // byte-identical duplicates: exactly one copy demoted to score 1
    const dupScores = data
      .filter((f: any) => f.path.startsWith("dup"))
      .map((f: any) => f.score);
    expect(dupScores.length).toBe(2);
    expect(dupScores.filter((s: number) => s === 1).length).toBe(1);
  } finally {
    await rm(D, { recursive: true, force: true });
  }
});
