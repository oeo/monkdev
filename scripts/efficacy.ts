#!/usr/bin/env bun
// Scores canon against the Conduit corpus, where the API spec defines which
// facts are genuinely restated across languages. Recall is objective. Precision
// is a proxy: it only penalizes known vocabulary, so it cannot catch novel noise.
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const CORPUS = join(ROOT, "corpus");
const BASELINE = join(ROOT, "bench", "efficacy.json");
const TOP = 40;

// spec-defined facts, each verified below to actually span 2+ languages here
const TRUTH = [
  "Article", "Comment", "Profile", "slug", "tagList", "favoritesCount",
  "favorited", "following", "bio", "unfavorite", "createdAt", "updatedAt",
  "DATABASE_URL", "8080", "description",
];

// clustered by the current heuristic but not project facts
const NOISE = [
  "that", "Content-Type", "color", "events", "types", "input", "with",
  "from", "have", "application", "which", "there", "these", "should",
];

if (!existsSync(CORPUS)) throw new Error("corpus missing; run: bun run corpus");

const run = async (args: string[]) => {
  const proc = Bun.spawn({ cmd: [join(ROOT, "bin", "monk"), ...args], stdout: "pipe", stderr: "ignore" });
  const out = await new Response(proc.stdout).text();
  await proc.exited;
  return JSON.parse(out);
};

const norm = (s: string) => s.toLowerCase().replace(/[_\-\s.]/g, "");
const all = await run(["canon", CORPUS, "--json", "--top", "100000"]);
const top = await run(["canon", CORPUS, "--json", "--top", String(TOP)]);

const has = (set: any[], term: string) =>
  set.some((c: any) => c.variants.some((v: string) => norm(v) === norm(term)));

// Ground truth must be established WITHOUT canon, or a fact canon misses gets
// dropped from the denominator and recall scores itself a perfect mark.
const langsOf = async (term: string) => {
  const proc = Bun.spawn({ cmd: ["grep", "-rlie", term, CORPUS], stdout: "pipe", stderr: "ignore" });
  const files = (await new Response(proc.stdout).text()).trim().split("\n").filter(Boolean);
  await proc.exited;
  const exts = new Set(files.map((f) => f.slice(f.lastIndexOf(".") + 1)).filter((e) => /^[a-z]{1,5}$/.test(e)));
  return exts.size;
};

const langCounts = Object.fromEntries(await Promise.all(TRUTH.map(async (t) => [t, await langsOf(t)] as const)));
const valid = TRUTH.filter((t) => langCounts[t]! >= 2);
const skipped = TRUTH.filter((t) => !valid.includes(t));
const foundAll = valid.filter((t) => has(all.clusters, t));
const foundTop = valid.filter((t) => has(top.clusters, t));
const noiseTop = NOISE.filter((n) => has(top.clusters, n));

const score = {
  recall: +(foundAll.length / valid.length).toFixed(3),
  recallTop: +(foundTop.length / valid.length).toFixed(3),
  noise: noiseTop.length,
  clusters: all.total,
};

const prev = existsSync(BASELINE) ? await Bun.file(BASELINE).json() : null;
const d = (n: number, p?: number) => (p === undefined ? "" : n === p ? "  ~" : `${n > p ? "+" : ""}${+(n - p).toFixed(3)}`);

console.log(`corpus ${all.scanned} files, ${all.total} clusters, truth terms ${valid.length}/${TRUTH.length}`);
if (skipped.length) console.log(`not restated across languages here, excluded: ${skipped.join(", ")}`);
console.log(`
metric        | value  | delta
--------------|--------|------
recall  (any) | ${String(score.recall).padEnd(6)} | ${d(score.recall, prev?.recall)}
recall  (top${TOP}) | ${String(score.recallTop).padEnd(6)} | ${d(score.recallTop, prev?.recallTop)}
noise   (top${TOP}) | ${String(score.noise).padEnd(6)} | ${d(score.noise, prev?.noise)}`);
console.log(`\nmissed: ${valid.filter((t) => !foundAll.includes(t)).join(", ") || "none"}`);
console.log(`noise hits: ${noiseTop.join(", ") || "none"}`);

if (process.argv.includes("--save")) {
  await Bun.write(BASELINE, JSON.stringify(score, null, 2));
  console.log(`\nbaseline written to ${BASELINE}`);
}
