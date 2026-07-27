import { test, expect } from "bun:test";
import { $ } from "bun";
import { mkdir, rm, writeFile } from "node:fs/promises";

test("context tool packs files into XML", async () => {
  await mkdir("test_ctx_dir", { recursive: true });
  await writeFile("test_ctx_dir/a.ts", "console.log('a');");
  await writeFile("test_ctx_dir/b.ts", "console.log('b');");
  await writeFile("test_ctx_dir/.gitignore", "*.log\n");
  await writeFile("test_ctx_dir/test.log", "hidden");

  try {
    // --raw keeps the assertions deterministic whether or not rtk is installed
    const { stdout } = await $`./bin/monk context test_ctx_dir --raw`.quiet();
    const out = stdout.toString();

    expect(out).toContain('<context directory="test_ctx_dir">');
    expect(out).toContain('<file path="a.ts">');
    expect(out).toContain("console.log('a');");
    expect(out).toContain("</file>");
    expect(out).toContain('<file path="b.ts">');
    expect(out).not.toContain("test.log"); // Should respect gitignore

    // Test stats-only
    const { stdout: statsOut } = await $`./bin/monk context test_ctx_dir --stats-only --raw`.quiet();
    const stats = statsOut.toString();
    expect(stats).toContain("Files to pack: 3"); // a.ts, b.ts, .gitignore
  } finally {
    await rm("test_ctx_dir", { recursive: true, force: true });
  }
});

test("context --min filters by importance score", async () => {
  const D = "test_ctx_min";
  await mkdir(D, { recursive: true });
  await writeFile(`${D}/package.json`, '{"name":"x","dependencies":{"react":"1"}}');
  await writeFile(`${D}/note.txt`, "plain note");

  try {
    const { stdout: treeOut } = await $`./bin/monk tree ${D} --json`.quiet();
    const files = JSON.parse(treeOut.toString());
    const top = Math.max(...files.map((f: any) => f.score));
    const low = Math.min(...files.map((f: any) => f.score));
    expect(top).toBeGreaterThan(low);

    const { stdout } = await $`./bin/monk context ${D} --raw --min ${top}`.quiet();
    const out = stdout.toString();
    expect(out).toContain('<file path="package.json">');
    expect(out).not.toContain("note.txt");
  } finally {
    await rm(D, { recursive: true, force: true });
  }
});

test("context --max-tokens packs top files and reports exclusions", async () => {
  const D = "test_ctx_pack";
  await mkdir(D, { recursive: true });
  await writeFile(`${D}/small.ts`, "export const a = 1;\n");
  await writeFile(`${D}/large.ts`, `export const b = "${"y".repeat(2000)}";\n`);
  const out = `${D}/packed.xml`;

  try {
    const { stdout } = await $`./bin/monk context ${D} --raw --max-tokens 100 --out ${out}`.quiet();
    expect(stdout.toString()).toContain("excluded 1 files");

    const xml = await Bun.file(out).text();
    expect(xml).toContain('<file path="small.ts">');
    expect(xml).not.toContain('<file path="large.ts">');
  } finally {
    await rm(D, { recursive: true, force: true });
  }
});

test("context auto-writes to a temp file over 10k tokens", async () => {
  const D = "test_ctx_big";
  await mkdir(D, { recursive: true });
  await writeFile(`${D}/big.ts`, `export const s = "${"x".repeat(45000)}";\n`);

  try {
    const { stdout } = await $`./bin/monk context ${D} --raw`.quiet();
    const m = stdout.toString().match(/Context successfully written to (\S+\.xml)/);
    expect(m).not.toBeNull();
    expect(await Bun.file(m![1]).exists()).toBe(true);
    await rm(m![1], { force: true });
  } finally {
    await rm(D, { recursive: true, force: true });
  }
});

test("context stubs byte-identical duplicates and escapes </file>", async () => {
  const D = "test_ctx_dup";
  await mkdir(D, { recursive: true });
  await writeFile(`${D}/a.ts`, "export const same = 1;\n");
  await writeFile(`${D}/b.ts`, "export const same = 1;\n");
  await writeFile(`${D}/tricky.ts`, 'const s = "</file>";\n');

  try {
    const { stdout } = await $`./bin/monk context ${D} --raw`.quiet();
    const out = stdout.toString();

    // duplicate body packed once, second copy stubbed
    expect(out).toContain('duplicateOf="a.ts"');
    expect(out.split("export const same = 1;").length - 1).toBe(1);

    // literal </file> in content cannot break the XML structure
    expect(out).toContain("<\\/file>");
    expect(out).not.toContain('const s = "</file>"');
  } finally {
    await rm(D, { recursive: true, force: true });
  }
});

test.skipIf(!Bun.which("rtk"))("context tool filters through rtk when installed", async () => {
  await mkdir("test_ctx_rtk", { recursive: true });
  await writeFile("test_ctx_rtk/a.ts", "// a comment rtk strips\nconsole.log('a');");

  try {
    const { stdout } = await $`./bin/monk context test_ctx_rtk`.quiet();
    const out = stdout.toString();

    expect(out).toContain('<context directory="test_ctx_rtk" filter="rtk-minimal">');
    expect(out).toContain("console.log('a');");
    expect(out).not.toContain("a comment rtk strips");

    const { stdout: statsOut } = await $`./bin/monk context test_ctx_rtk --stats-only`.quiet();
    expect(statsOut.toString()).toContain("(rtk minimal filter active)");
  } finally {
    await rm("test_ctx_rtk", { recursive: true, force: true });
  }
});
