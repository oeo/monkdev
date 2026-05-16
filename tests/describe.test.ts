import { test, expect } from "bun:test";
import { $ } from "bun";

test("describe tool outputs schema correctly", async () => {
  const { stdout } = await $`./bin/monk describe fetch-url --json`.quiet();
  const data = JSON.parse(stdout.toString());
  
  expect(data.name).toBe("fetch-url");
  expect(data.description).toBeDefined();
  expect(data.args).toBeDefined();
  expect(data.args.url.required).toBe(true);
});
