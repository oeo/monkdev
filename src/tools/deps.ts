import { defineCommand } from "citty";
import { existsSync } from "node:fs";
import { join } from "node:path";

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

    // 1. Node.js (package.json)
    const pkgPath = join(targetDir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = await Bun.file(pkgPath).json();
        const deps = [
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.devDependencies || {}),
          ...Object.keys(pkg.peerDependencies || {})
        ];
        if (deps.length > 0) {
          results.push({ type: "Node (package.json)", deps });
        }
      } catch (e) {}
    }

    // 2. Rust (Cargo.toml)
    const cargoPath = join(targetDir, "Cargo.toml");
    if (existsSync(cargoPath)) {
      try {
        const text = await Bun.file(cargoPath).text();
        const deps: string[] = [];
        const lines = text.split("\n");
        let inDeps = false;
        
        for (const line of lines) {
          const t = line.trim();
          if (t.startsWith("[") && t.endsWith("]")) {
            inDeps = t.includes("dependencies");
            continue;
          }
          if (inDeps && t && !t.startsWith("#")) {
            const pkgName = t.split("=")[0].trim();
            if (pkgName) deps.push(pkgName);
          }
        }
        if (deps.length > 0) {
          results.push({ type: "Rust (Cargo.toml)", deps });
        }
      } catch (e) {}
    }

    // 3. Python (requirements.txt)
    const reqPath = join(targetDir, "requirements.txt");
    if (existsSync(reqPath)) {
      try {
        const text = await Bun.file(reqPath).text();
        const deps = text.split("\n")
          .map(l => l.split(/[=<>~]/)[0].trim())
          .filter(l => l && !l.startsWith("#"));
        if (deps.length > 0) {
          results.push({ type: "Python (requirements.txt)", deps });
        }
      } catch (e) {}
    }

    // 4. Go (go.mod)
    const goPath = join(targetDir, "go.mod");
    if (existsSync(goPath)) {
      try {
        const text = await Bun.file(goPath).text();
        const deps: string[] = [];
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
            deps.push(t.split(" ")[0]);
          } else if (t.startsWith("require ") && !t.endsWith("(")) {
            deps.push(t.split(" ")[1]);
          }
        }
        if (deps.length > 0) {
          results.push({ type: "Go (go.mod)", deps });
        }
      } catch (e) {}
    }

    const isJson = args.json || !process.stdout.isTTY;

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
