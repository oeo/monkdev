import { defineCommand } from "citty";
import { resolve } from "node:path";
import { collectFiles } from "../lib/walk";

// .tsx and .ts are one language wearing two extensions; folding stops that inflating the span
const FAMILY: Record<string, string> = {
  tsx: "ts", jsx: "ts", js: "ts", mjs: "ts", cjs: "ts", mts: "ts", cts: "ts",
  mdx: "md", rst: "md", txt: "md", yml: "yaml", h: "c", hpp: "cpp", cc: "cpp",
};

const STOP = new Set([
  "true", "false", "null", "none", "self", "this", "type", "name", "value", "data",
  "error", "result", "string", "number", "boolean", "object", "array", "void",
  "return", "import", "export", "public", "static", "const", "async", "await",
  "utf8", "text", "json", "html", "http", "https", "test", "tests", "main", "index",
  "default", "options", "config", "path", "file", "line", "list", "item", "args",
  // English function words: prose and comments, never a fact worth canonicalizing
  "that", "this", "with", "from", "have", "has", "had", "will", "would", "could",
  "should", "must", "can", "may", "the", "and", "for", "not", "but", "are", "was",
  "were", "been", "being", "they", "them", "their", "there", "these", "those",
  "into", "onto", "over", "under", "after", "before", "while", "about", "above",
  "below", "between", "because", "however", "therefore", "when", "where", "what",
  "which", "than", "then", "such", "some", "only", "also", "both", "each", "same",
  "you", "your", "our", "its", "out", "who", "how", "why", "all", "any", "one",
  "two", "new", "old", "get", "set", "use", "used", "using", "does", "did", "done",
  // protocol vocabulary: defined by an RFC, not by the project
  "contenttype", "applicationjson", "authorization", "accept", "useragent",
]);

const PATTERNS = [
  /"([^"\n]{3,60})"|'([^'\n]{3,60})'|`([^`\n$]{3,60})`/g,
  /\b(\d{2,})\b/g,
  /\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/g,
  /(?:class|struct|enum|interface|type|trait|fn|func|def|function|message|TABLE|TYPE)\s+([A-Za-z_][A-Za-z0-9_]*)/g,
];

const norm = (s: string) => s.toLowerCase().replace(/[_\-\s.]/g, "");

interface Hit { file: string; line: number; raw: string; lang: string }

export default defineCommand({
  meta: {
    name: "canon",
    description: "Cluster facts restated in more than one language: candidate drift between duplicated sources of truth.",
  },
  args: {
    path: { type: "positional", description: "Directory to scan", required: false, default: "." },
    min: { type: "string", description: "Only scan files with importance score >= this (1-10)", required: false },
    "max-files": { type: "string", description: "Drop clusters spanning more than N files. Bare numbers are capped at 12 regardless, since a recurring integer is usually coincidence while a recurring identifier is usually a restated fact", default: "25" },
    top: { type: "string", description: "Report only the N widest-spanning clusters", default: "40" },
    json: { type: "boolean", description: "Output JSON", default: false },
  },
  async run({ args }) {
    const dir = resolve(args.path || ".");
    const min = args.min ? Number(args.min) : 0;
    const ceiling = Number(args["max-files"]);
    const top = Number(args.top);
    if ([min, ceiling, top].some(Number.isNaN)) throw new Error("--min, --max-files and --top must be numbers");

    const groups = new Map<string, Map<string, Hit>>();
    let scanned = 0;

    for (const f of (await collectFiles(dir)).files) {
      if (f.monkIgnored || f.score < min) continue;
      scanned++;
      const base = f.path.slice(f.path.lastIndexOf("/") + 1).toLowerCase();
      const dot = base.lastIndexOf(".");
      const ext = base.startsWith(".env") ? "env" : dot > 0 ? base.slice(dot + 1) : "-";
      const lang = FAMILY[ext] ?? ext;
      const lines = f.text.split("\n");

      for (let i = 0; i < lines.length; i++) {
        for (const p of PATTERNS) {
          for (const m of lines[i]!.matchAll(p)) {
            const raw = m[1] ?? m[2] ?? m[3] ?? "";
            const key = norm(raw);
            if (key.length < 3 || STOP.has(key)) continue;
            let hits = groups.get(key);
            if (!hits) groups.set(key, (hits = new Map()));
            hits.set(`${f.path}:${i + 1}`, { file: f.path, line: i + 1, raw, lang });
          }
        }
      }
    }

    const clusters = [...groups.values()]
      .map((m) => [...m.values()])
      .map((hits) => ({
        hits,
        langs: [...new Set(hits.map((h) => h.lang))],
        files: [...new Set(hits.map((h) => h.file))],
        variants: [...new Set(hits.map((h) => h.raw))],
      }))
      .filter((c) => {
        // a bare integer recurring across many files is coincidence (sizes, CSS,
        // version fragments); an identifier recurring that widely is a real fact
        const cap = /^\d+$/.test(norm(c.variants[0]!)) ? Math.min(12, ceiling) : ceiling;
        return c.langs.length >= 2 && c.files.length >= 2 && c.files.length <= cap;
      })
      .sort((a, b) => b.langs.length - a.langs.length || b.files.length - a.files.length);

    const shown = clusters.slice(0, top);

    if (args.json) {
      const clusterJson = shown.map((c) => ({ variants: c.variants, langs: c.langs, hits: c.hits }));
      console.log(JSON.stringify({ scanned, shown: shown.length, total: clusters.length, clusters: clusterJson }, null, 2));
      return;
    }

    for (const c of shown) {
      console.log(`${c.variants.join(" | ")}  [${c.langs.length} langs: ${c.langs.join(",")}, ${c.files.length} files]`);
      const byFile = new Map<string, number[]>();
      for (const h of c.hits) byFile.set(h.file, [...(byFile.get(h.file) ?? []), h.line]);
      for (const [file, ls] of byFile) console.log(`    ${file}:${ls.join(",")}`);
    }

    console.log(`\n${shown.length} of ${clusters.length} clusters shown, ${scanned} files scanned${min ? ` at min=${min}` : ""}.`);
    if (clusters.length > shown.length) console.log(`${clusters.length - shown.length} clusters not shown; raise --top or narrow the path.`);
    console.log("Candidates only. A cluster is drift only once the copies are read and found to disagree.");
  },
});
