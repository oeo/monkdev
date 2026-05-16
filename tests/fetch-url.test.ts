import { test, expect } from "bun:test";
import { $ } from "bun";

test("fetch-url fetches and parses a basic web page", async () => {
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
}, 60000); // Generous timeout for browser download/startup on first run
