import { test, expect } from "bun:test";
import { $ } from "bun";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("piped stdout survives past the 64KB pipe buffer", async () => {
  const D = await mkdtemp(join(tmpdir(), "monk-stdout-"));
  const src = join(D, "big.txt");
  const redirected = join(D, "redirected.out");
  await writeFile(src, `${"x".repeat(63)}\n`.repeat(3000));

  try {
    const piped = await $`./bin/monk catfiles ${src} | cat`.quiet();
    await $`./bin/monk catfiles ${src} > ${redirected}`.quiet();
    const onDisk = await Bun.file(redirected).bytes();

    expect(piped.exitCode).toBe(0);
    expect(onDisk.length).toBeGreaterThan(65536);
    expect(piped.stdout.length).toBe(onDisk.length);
    expect(piped.stdout.toString()).toBe(new TextDecoder().decode(onDisk));
  } finally {
    await rm(D, { recursive: true, force: true });
  }
});
