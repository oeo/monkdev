import { defineCommand } from "citty";
import { existsSync } from "node:fs";
import { join } from "node:path";

// [dependencies], [dev-dependencies], [build-dependencies], with optional
// workspace./target.<triple>. prefix; [dependencies.<name>] declares <name>.
const CARGO_DEP_SECTION =
  /^\[(?:workspace\.|target\.[^.]+\.)?(dev-|build-)?dependencies(?:\.(.+))?\]$/;

export default defineCommand({
  meta: {
    name: "deps",
    description: "Map the dependencies of a given directory across multiple ecosystems (Node, Rust, Python, Go).",
  },
  args: {
    path: {
      type: "positional",
      description: "Directory to scan for manifests",
      required: false,
      default: ".",
    },
    json: {
      type: "boolean",
      description: "Output JSON",
      default: false,
    },
  },
  async run({ args }) {
    const targetDir = args.path || ".";

    const results: { type: string; deps: string[] }[] = [];
    const warn = (path: string, e: unknown) =>
      console.error(`monk: failed to parse ${path}: ${(e as Error).message}`);

    // 1. Node.js (package.json)
    const pkgPath = join(targetDir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = await Bun.file(pkgPath).json();
        // kept apart: a survey that merges dev into prod overstates the runtime surface
        for (const [field, label] of [["dependencies", ""], ["devDependencies", " dev"], ["peerDependencies", " peer"]] as const) {
          const deps = Object.keys(pkg[field] || {});
          if (deps.length > 0) results.push({ type: `Node (package.json${label})`, deps });
        }
      } catch (e) {
        warn(pkgPath, e);
      }
    }

    // 2. Rust (Cargo.toml)
    const cargoPath = join(targetDir, "Cargo.toml");
    if (existsSync(cargoPath)) {
      try {
        const text = await Bun.file(cargoPath).text();
        // bucketed by kind, so a crate in both [dependencies] and
        // [dev-dependencies] is reported once per kind rather than twice over
        const buckets = new Map<string, Set<string>>();
        const add = (k: string, name: string) =>
          buckets.set(k, (buckets.get(k) ?? new Set()).add(name));
        let kind: string | null = null;

        for (const line of text.split("\n")) {
          const t = line.trim();
          if (t.startsWith("[") && t.endsWith("]")) {
            const section = CARGO_DEP_SECTION.exec(t);
            const k = section ? { "dev-": " dev", "build-": " build" }[section[1] ?? ""] ?? "" : null;
            // [dependencies.tokio]: tokio is the dep, its keys are config.
            if (section?.[2]) { add(k!, section[2]); kind = null; }
            else kind = k;
            continue;
          }
          if (kind !== null && t && !t.startsWith("#")) {
            const pkgName = t.split("=")[0]?.trim();
            if (pkgName) add(kind, pkgName);
          }
        }
        for (const [k, deps] of buckets) {
          if (deps.size > 0) results.push({ type: `Rust (Cargo.toml${k})`, deps: [...deps] });
        }
      } catch (e) {
        warn(cargoPath, e);
      }
    }

    // 3. Python (requirements.txt / pyproject.toml)
    const reqPath = join(targetDir, "requirements.txt");
    if (existsSync(reqPath)) {
      try {
        const text = await Bun.file(reqPath).text();
        const deps = text.split("\n")
          .map(l => l.split(/[=<>~]/)[0]?.trim() ?? "")
          .filter(l => l && !l.startsWith("#") && !l.startsWith("-"));
        if (deps.length > 0) {
          results.push({ type: "Python (requirements.txt)", deps });
        }
      } catch (e) {
        warn(reqPath, e);
      }
    }

    const pyprojectPath = join(targetDir, "pyproject.toml");
    if (existsSync(pyprojectPath)) {
      try {
        const text = await Bun.file(pyprojectPath).text();
        const deps: string[] = [];

        // PEP 621: dependencies = ["pkg>=1", ...] (possibly multiline array)
        const arr = text.match(/^dependencies\s*=\s*\[([^\]]*)\]/m);
        for (const q of (arr?.[1] ?? "").matchAll(/"([^"]+)"|'([^']+)'/g)) {
          const name = (q[1] ?? q[2] ?? "").split(/[=<>~!;\[ ]/)[0]?.trim();
          if (name) deps.push(name);
        }

        // Poetry: [tool.poetry.dependencies] key = version
        let inPoetry = false;
        for (const line of text.split("\n")) {
          const t = line.trim();
          if (t.startsWith("[")) {
            inPoetry = t === "[tool.poetry.dependencies]";
            continue;
          }
          if (inPoetry && t && !t.startsWith("#")) {
            const name = t.split("=")[0]?.trim();
            if (name && name !== "python") deps.push(name);
          }
        }
        if (deps.length > 0) {
          results.push({ type: "Python (pyproject.toml)", deps });
        }
      } catch (e) {
        warn(pyprojectPath, e);
      }
    }

    // 4. Go (go.mod)
    const goPath = join(targetDir, "go.mod");
    if (existsSync(goPath)) {
      try {
        const text = await Bun.file(goPath).text();
        const deps: string[] = [];
        const indirect: string[] = []; // go.mod lists the whole transitive set; merging them overstates direct use
        let inRequire = false;

        for (const line of text.split("\n")) {
          const t = line.trim();
          if (t === "require (") {
            inRequire = true;
            continue;
          }
          if (inRequire && t === ")") {
            inRequire = false;
            continue;
          }
          if (inRequire && t && !t.startsWith("//")) {
            const name = t.split(" ")[0];
            if (name) (t.includes("// indirect") ? indirect : deps).push(name);
          } else if (t.startsWith("require ") && !t.endsWith("(")) {
            const name = t.split(" ")[1];
            if (name) (t.includes("// indirect") ? indirect : deps).push(name);
          }
        }
        if (deps.length > 0) results.push({ type: "Go (go.mod)", deps });
        if (indirect.length > 0) results.push({ type: "Go (go.mod indirect)", deps: indirect });
      } catch (e) {
        warn(goPath, e);
      }
    }

    const isJson = args.json;

    if (isJson) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      if (results.length === 0) {
        console.log(`(ERROR_UNSUPPORTED_ECOSYSTEM: Could not find any recognizable dependency manifests in ${targetDir})`);
        return;
      }

      console.log(`Dependencies for ${targetDir}:`);
      for (const res of results) {
        console.log(`\n[${res.type}]`);
        for (const d of res.deps) {
          console.log(`  - ${d}`);
        }
      }
    }
  },
});
