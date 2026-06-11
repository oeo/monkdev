import { test, expect } from "bun:test";
import { $ } from "bun";
import { existsSync, rmSync } from "fs";

test("screenshot-url emits a base64 PNG of a rendered page", async () => {
  const { stdout, exitCode, stderr } =
    await $`./bin/monk screenshot-url https://example.com`.quiet();

  if (exitCode !== 0) {
    console.error(stderr.toString());
  }

  expect(exitCode).toBe(0);
  // Base64-encoded PNG always begins with the "iVBORw0KGgo" signature.
  expect(stdout.toString().trim().startsWith("iVBORw0KGgo")).toBe(true);
}, 60000);

test("screenshot-url --out writes a PNG file and prints its path", async () => {
  const out = `/tmp/monk-screenshot-${process.pid}.png`;
  try {
    const { stdout, exitCode } =
      await $`./bin/monk screenshot-url https://example.com --out ${out}`.quiet();

    expect(exitCode).toBe(0);
    expect(stdout.toString().trim()).toBe(out);
    expect(existsSync(out)).toBe(true);
  } finally {
    rmSync(out, { force: true });
  }
}, 60000);
