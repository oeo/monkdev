import { test, expect } from "bun:test";
import { tools } from "../src/tools/index";
import { existsSync } from "fs";
import { join } from "path";

test("all tools must follow strict architectural conventions", () => {
  for (const tool of tools) {
    const name = tool.meta.name;
    const description = tool.meta.description;
    
    // 1. Must have a valid name and description (required for MCP capabilities)
    expect(name).toBeDefined();
    expect(typeof name).toBe("string");
    expect(description).toBeDefined();
    expect(typeof description).toBe("string");
    
    // 2. Must have a dedicated integration test ensuring reliability
    const testPath = join(import.meta.dir, `${name}.test.ts`);
    const hasTest = existsSync(testPath);
    
    if (!hasTest) {
      throw new Error(`Strict Convention Violation: Tool '${name}' is missing its integration test at 'tests/${name}.test.ts'`);
    }
    expect(hasTest).toBe(true);
  }
});
