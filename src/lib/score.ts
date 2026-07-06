// Heuristic importance score for a file, from its path and size alone,
// mapped to a 1-10 scale (10 = core architecture, 1 = pure noise).
// Signals: role (manifest/entry-point), location (src vs test/vendor/assets),
// extension class, nesting depth, and log-scaled LOC.
// Meditation thresholds: standard ingests 8+, deep ingests 5+.

const MANIFESTS = new Set([
  "package.json",
  "cargo.toml",
  "pyproject.toml",
  "go.mod",
  "justfile",
  "makefile",
  "cmakelists.txt",
  "platformio.ini",
  "dockerfile",
  "build.rs",
  "readme.md",
]);

const ENTRY_STEMS = new Set(["main", "lib", "mod", "app", "cli", "server", "__init__"]);

const CODE_EXTS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "rs", "py", "go", "c", "cc", "cpp", "h", "hpp",
  "ino", "lua", "luau", "java", "kt", "swift", "rb", "php", "zig", "scad", "sh",
]);
const DOC_EXTS = new Set(["md", "mdx", "rst"]);
const DATA_EXTS = new Set(["json", "yaml", "yml", "toml", "xml", "ini", "hbs", "html", "css"]);

// Penalty applied once per path (max of matching segments, not cumulative).
const NOISE_DIRS: Record<string, number> = {
  test: 20, tests: 20, __tests__: 20, spec: 20, specs: 20, mocks: 20,
  fixtures: 25, snapshots: 25, benches: 15, examples: 15,
  vendor: 30, third_party: 30, generated: 30, gen: 25,
  docs: 12, assets: 18, public: 18, static: 18, images: 20, fonts: 25,
};

export function scoreFile(path: string, loc: number): number {
  const segs = path.toLowerCase().split("/");
  const base = segs[segs.length - 1];
  const dot = base.lastIndexOf(".");
  const ext = dot > 0 ? base.slice(dot + 1) : "";
  const stem = dot > 0 ? base.slice(0, dot) : base;

  let s = 0;

  if (CODE_EXTS.has(ext)) s += 15;
  else if (DOC_EXTS.has(ext)) s += 6;
  else if (DATA_EXTS.has(ext)) s += 4;

  if (MANIFESTS.has(base)) s += 25;
  else if (ENTRY_STEMS.has(stem) && CODE_EXTS.has(ext)) s += 20;
  // "index" is a weak signal: every JS directory has one, often a tiny barrel.
  else if (stem === "index" && CODE_EXTS.has(ext)) s += 10;
  else if (stem.endsWith(".config") || stem.endsWith(".conf")) s += 10;

  // Scratch / leftover files.
  if (/^(tmp|temp|old|scratch|deprecated)[._-]/.test(stem)) s -= 15;

  // Generated / derivative artifacts.
  if (ext === "map" || base.endsWith(".min.js") || stem.endsWith(".d")) s -= 25;
  // Test files by name.
  if (stem.endsWith(".test") || stem.endsWith(".spec") || stem.endsWith("_test")) s -= 20;

  const dirs = segs.slice(0, -1);
  if (dirs.includes("src")) s += 8;
  let noise = 0;
  for (const d of dirs) {
    const p = NOISE_DIRS[d];
    if (p && p > noise) noise = p;
  }
  s -= noise;

  s -= Math.min(dirs.length * 2, 10);
  s += Math.min(Math.log2(loc + 1) * 1.5, 12);

  // Raw range is roughly -25..55; compress to 1-10.
  return Math.max(1, Math.min(10, Math.round((s + 25) / 8)));
}
