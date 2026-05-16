import { test, expect } from "bun:test";
import { $ } from "bun";
import { mkdir, rm, writeFile } from "node:fs/promises";

test("deps parses package.json and Cargo.toml correctly", async () => {
  await mkdir("test_deps_dir", { recursive: true });
  
  // Create mock package.json
  await writeFile("test_deps_dir/package.json", JSON.stringify({
    dependencies: { "react": "^18.0.0" },
    devDependencies: { "typescript": "5.0.0" }
  }));
  
  // Create mock Cargo.toml
  await writeFile("test_deps_dir/Cargo.toml", "[dependencies]\nserde = \"1.0\"\n[dev-dependencies]\ntokio = \"1.0\"");

  const { stdout } = await $`./bin/monk deps test_deps_dir --json`.quiet();
  const res = JSON.parse(stdout.toString());
  
  expect(res.length).toBe(2);
  
  const nodeDeps = res.find((r: any) => r.type === "Node (package.json)");
  expect(nodeDeps.deps).toContain("react");
  expect(nodeDeps.deps).toContain("typescript");
  
  const rustDeps = res.find((r: any) => r.type === "Rust (Cargo.toml)");
  expect(rustDeps.deps).toContain("serde");
  expect(rustDeps.deps).toContain("tokio");

  await rm("test_deps_dir", { recursive: true, force: true });
});
