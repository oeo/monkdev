import { test, expect } from "bun:test";
import { $ } from "bun";

test("symbol locates definitions correctly", async () => {
  // Setup dummy files to search
  await Bun.write("test_struct.rs", "pub struct MyTargetStruct {\n  pub id: u32,\n}");
  await Bun.write("test_func.ts", "export function MyTargetFunc() {\n  return 1;\n}");
  
  // Test 1: Rust struct
  const { stdout: out1 } = await $`./bin/monk symbol MyTargetStruct --json`.quiet();
  const res1 = JSON.parse(out1.toString());
  expect(res1.some((r: any) => r.file.endsWith("test_struct.rs"))).toBe(true);
  
  // Test 2: TS function
  const { stdout: out2 } = await $`./bin/monk symbol MyTargetFunc --json`.quiet();
  const res2 = JSON.parse(out2.toString());
  expect(res2.some((r: any) => r.file.endsWith("test_func.ts"))).toBe(true);
  
  // Cleanup
  await $`rm test_struct.rs test_func.ts`;
});
