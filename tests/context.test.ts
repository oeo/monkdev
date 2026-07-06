import { test, expect } from "bun:test";
import { $ } from "bun";
import { mkdir, rm, writeFile } from "node:fs/promises";

test("context tool packs files into XML", async () => {
  await mkdir("test_ctx_dir", { recursive: true });
  await writeFile("test_ctx_dir/a.ts", "console.log('a');");
  await writeFile("test_ctx_dir/b.ts", "console.log('b');");
  await writeFile("test_ctx_dir/.gitignore", "*.log\n");
  await writeFile("test_ctx_dir/test.log", "hidden");

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

  await rm("test_ctx_dir", { recursive: true, force: true });
});

test.skipIf(!Bun.which("rtk"))("context tool filters through rtk when installed", async () => {
  await mkdir("test_ctx_rtk", { recursive: true });
  await writeFile("test_ctx_rtk/a.ts", "// a comment rtk strips\nconsole.log('a');");

  const { stdout } = await $`./bin/monk context test_ctx_rtk`.quiet();
  const out = stdout.toString();

  expect(out).toContain('<context directory="test_ctx_rtk" filter="rtk-minimal">');
  expect(out).toContain("console.log('a');");
  expect(out).not.toContain("a comment rtk strips");

  const { stdout: statsOut } = await $`./bin/monk context test_ctx_rtk --stats-only`.quiet();
  expect(statsOut.toString()).toContain("(rtk minimal filter active)");

  await rm("test_ctx_rtk", { recursive: true, force: true });
});
