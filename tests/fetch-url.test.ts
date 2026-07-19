import { test, expect } from "bun:test";
import { $ } from "bun";
import { findChrome } from "../src/lib/browser";

const hasChrome = (() => {
  try {
    findChrome();
    return true;
  } catch {
    return false;
  }
})();

test.skipIf(!hasChrome)("fetch-url fetches and parses a basic web page", async () => {
  const { stdout, exitCode, stderr } = await $`./bin/monk fetch-url https://example.com --format text --json`.quiet();
  
  if (exitCode !== 0) {
    console.error(stderr.toString());
  }
  
  expect(exitCode).toBe(0);
  const data = JSON.parse(stdout.toString());
  
  expect(data.url).toContain("example.com");
  expect(data.title).toContain("Example Domain");
  expect(data.format).toBe("text");
  
  // The content of example.com should contain these words
  expect(data.content).toContain("Example Domain");
  expect(data.content).toContain("Learn more");
}, 60000); // Generous timeout for browser startup on first run

test.skipIf(!hasChrome)("fetch-url truncates with steering marker when --max-tokens is exceeded", async () => {
  const { stdout, exitCode } = await $`./bin/monk fetch-url https://example.com --format text --json --max-tokens 10`.quiet();
  expect(exitCode).toBe(0);
  const data = JSON.parse(stdout.toString());
  expect(data.truncated).toBe(true);
  expect(data.content).toContain("[monk: truncated at ~10 tokens");
  expect(data.content.length).toBeLessThan(10 * 4 + 200); // cap + marker slack
}, 60000);
