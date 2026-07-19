import { test, expect } from "bun:test";
import { $ } from "bun";

test("symbol locates definitions correctly", async () => {
  await Bun.write("test_struct.rs", "pub struct MyTargetStruct {\n  pub id: u32,\n}");
  await Bun.write("test_func.ts", "export function MyTargetFunc() {\n  return 1;\n}");
  await Bun.write("test_def.py", "def my_target_def():\n    return 1\n");

  try {
    const { stdout: out1 } = await $`./bin/monk symbol MyTargetStruct --json`.quiet();
    const res1 = JSON.parse(out1.toString());
    expect(res1.some((r: any) => r.file.endsWith("test_struct.rs"))).toBe(true);

    const { stdout: out2 } = await $`./bin/monk symbol MyTargetFunc --json`.quiet();
    const res2 = JSON.parse(out2.toString());
    expect(res2.some((r: any) => r.file.endsWith("test_func.ts"))).toBe(true);

    const { stdout: out3 } = await $`./bin/monk symbol my_target_def --json`.quiet();
    const res3 = JSON.parse(out3.toString());
    expect(res3.some((r: any) => r.file.endsWith("test_def.py"))).toBe(true);
  } finally {
    await $`rm -f test_struct.rs test_func.ts test_def.py`;
  }
});
