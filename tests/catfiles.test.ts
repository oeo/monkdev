import { test, expect } from "bun:test";
import { $ } from "bun";

test("catfiles correctly formats text, binary, and missing files", async () => {
  // Create test files
  await Bun.write("test_text.txt", "line1\nline2\nline3");
  const binBuffer = new Uint8Array([0, 1, 2, 3]);
  await Bun.write("test_bin.bmp", binBuffer);

  const { stdout } = await $`./bin/monk catfiles test_text.txt test_bin.bmp missing.txt`.quiet();
  const output = stdout.toString();

  // Assertions
  expect(output).toContain("catfile test_text.txt (3 LOC):\nline1\nline2\nline3");
  expect(output).toContain("catfile test_bin.bmp (ERROR_FILE_NON_TEXT)");
  expect(output).toContain("catfile missing.txt (ERROR_FILE_NOT_FOUND)");

  // Cleanup
  await $`rm test_text.txt test_bin.bmp`;
});
