import { test, expect } from "bun:test";
import { $ } from "bun";

test("catfiles correctly formats text, binary, and missing files", async () => {
  await Bun.write("test_text.txt", "line1\nline2\nline3");
  const binBuffer = new Uint8Array([0, 1, 2, 3]);
  await Bun.write("test_bin.bmp", binBuffer);

  try {
    const { stdout } = await $`./bin/monk catfiles test_text.txt test_bin.bmp missing.txt`.quiet();
    const output = stdout.toString();

    expect(output).toContain("catfile test_text.txt (3 LOC):\nline1\nline2\nline3");
    expect(output).toContain("catfile test_bin.bmp (ERROR_FILE_NON_TEXT)");
    expect(output).toContain("catfile missing.txt (ERROR_FILE_NOT_FOUND)");
  } finally {
    await $`rm -f test_text.txt test_bin.bmp`;
  }
});

test("catfiles accepts comma-separated --files (the mcp invocation path)", async () => {
  await Bun.write("test_cf_a.txt", "alpha\n");
  await Bun.write("test_cf_b.txt", "beta\n");

  try {
    const { stdout } = await $`./bin/monk catfiles --files=test_cf_a.txt,test_cf_b.txt`.quiet();
    const output = stdout.toString();

    expect(output).toContain("catfile test_cf_a.txt (1 LOC):\nalpha");
    expect(output).toContain("catfile test_cf_b.txt (1 LOC):\nbeta");
  } finally {
    await $`rm -f test_cf_a.txt test_cf_b.txt`;
  }
});

test("catfiles refuses files over 5000 lines, even with --stats-only", async () => {
  await Bun.write("test_cf_big.txt", "x\n".repeat(5001));

  try {
    const { stdout } = await $`./bin/monk catfiles test_cf_big.txt`.quiet();
    expect(stdout.toString()).toContain("catfile test_cf_big.txt (ERROR_FILE_TOO_LARGE)");

    const { stdout: stats } = await $`./bin/monk catfiles test_cf_big.txt --stats-only`.quiet();
    expect(stats.toString()).toContain("ERROR_FILE_TOO_LARGE");
  } finally {
    await $`rm -f test_cf_big.txt`;
  }
});

test("catfiles --stats-only reports LOC and tokens without content", async () => {
  await Bun.write("test_cf_stats.txt", "one\ntwo\nthree");

  try {
    const { stdout } = await $`./bin/monk catfiles test_cf_stats.txt --stats-only`.quiet();
    const output = stdout.toString();

    expect(output).toContain("catfile test_cf_stats.txt (3 LOC, ~4 tokens)");
    expect(output).not.toContain("one\ntwo\nthree");
  } finally {
    await $`rm -f test_cf_stats.txt`;
  }
});
