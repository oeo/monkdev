import { test, expect } from "bun:test";
import { $ } from "bun";
import { mkdir, rm, writeFile } from "node:fs/promises";

test("deps parses package.json, Cargo.toml, and pyproject.toml correctly", async () => {
  await mkdir("test_deps_dir", { recursive: true });

  await writeFile("test_deps_dir/package.json", JSON.stringify({
    dependencies: { "react": "^18.0.0" },
    devDependencies: { "typescript": "5.0.0" }
  }));

  await writeFile(
    "test_deps_dir/Cargo.toml",
    '[dependencies]\nserde = "1.0"\n[dependencies.tokio]\nversion = "1.0"\nfeatures = ["full"]\n[dev-dependencies]\nmockall = "0.12"\n[workspace.metadata]\nnot_a_dep = true',
  );

  await writeFile(
    "test_deps_dir/pyproject.toml",
    '[project]\nname = "x"\ndependencies = ["requests>=2.0", "flask"]\n',
  );

  try {
    const { stdout } = await $`./bin/monk deps test_deps_dir --json`.quiet();
    const res = JSON.parse(stdout.toString());

    const nodeDeps = res.find((r: any) => r.type === "Node (package.json)");
    expect(nodeDeps.deps).toContain("react");
    expect(nodeDeps.deps).toContain("typescript");

    const rustDeps = res.find((r: any) => r.type === "Rust (Cargo.toml)");
    expect(rustDeps.deps).toContain("serde");
    expect(rustDeps.deps).toContain("tokio");
    expect(rustDeps.deps).toContain("mockall");
    expect(rustDeps.deps).not.toContain("version");
    expect(rustDeps.deps).not.toContain("features");
    expect(rustDeps.deps).not.toContain("not_a_dep");

    const pyDeps = res.find((r: any) => r.type === "Python (pyproject.toml)");
    expect(pyDeps.deps).toContain("requests");
    expect(pyDeps.deps).toContain("flask");
  } finally {
    await rm("test_deps_dir", { recursive: true, force: true });
  }
});
