#!/usr/bin/env bun
import { existsSync, watch } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const MONK = join(import.meta.dir, "..", "bin", "monk");
const SRC = join(import.meta.dir, "..", "src");
const CTX = join(tmpdir(), "monk-bench-context.xml");

const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
const target = resolve(
  process.argv.slice(2).find((a) => !a.startsWith("--")) ??
    process.env.MONK_BENCH_TARGET ??
    join(homedir(), "www/ghostpeek-v2"),
);
const runs = Number(process.env.MONK_BENCH_RUNS ?? 3);

if (!existsSync(target)) throw new Error(`Bench target not found: ${target}`);

// one baseline per target: a shared file would diff ghostpeek numbers against monk numbers
const BASELINE = join(import.meta.dir, "..", "bench", `${basename(target)}.json`);

interface Case { name: string; args: string[]; out?: string }

const CASES: Case[] = [
  { name: "tree.all", args: ["tree", target, "--json"] },
  { name: "tree.min7", args: ["tree", target, "--json", "--min", "7"] },
  { name: "context.stats", args: ["context", target, "--stats-only"] },
  { name: "context.100k", args: ["context", target, "--max-tokens", "100000", "--out", CTX], out: CTX },
  { name: "symbol.client", args: ["symbol", "Client", "--path", target, "--json"] },
  { name: "deps.root", args: ["deps", target, "--json"] },
  { name: "canon.all", args: ["canon", target, "--json", "--top", "40"] },
  { name: "canon.min6", args: ["canon", target, "--json", "--min", "6", "--top", "40"] },
];

interface Metric { ms: number; bytes: number; tokens: number; count: number }

async function measure(c: Case): Promise<Metric> {
  const times: number[] = [];
  let out = "";
  for (let i = 0; i <= runs; i++) {
    const t0 = performance.now();
    const proc = Bun.spawn({ cmd: [MONK, ...c.args], stdout: "pipe", stderr: "ignore" });
    out = await new Response(proc.stdout).text();
    await proc.exited;
    if (proc.exitCode !== 0) throw new Error(`${c.name} exited ${proc.exitCode}: ${c.args.join(" ")}`);
    if (i > 0) times.push(performance.now() - t0); // i=0 warms the page cache
  }
  times.sort((a, b) => a - b);
  const bytes = c.out ? Bun.file(c.out).size : out.length;
  let count = 0;
  try {
    const j = JSON.parse(out);
    count = Array.isArray(j) ? j.length : (j.total ?? 0);
  } catch {} // stats-only and packed runs emit prose, size is their metric
  return { ms: Math.round(times[times.length >> 1]!), bytes, tokens: Math.ceil(bytes / 4), count };
}

const delta = (now: number, was: number | undefined) => {
  if (was === undefined || was === 0) return "";
  const p = ((now - was) / was) * 100;
  if (Math.abs(p) < 1) return "     ~";
  return `${p > 0 ? "+" : ""}${p.toFixed(0)}%`.padStart(6);
};

async function sweep(prev: Record<string, Metric> | null) {
  const now: Record<string, Metric> = {};
  console.log(`target ${target}  runs ${runs} (median)\n`);
  console.log("case            |     ms |   Δms |  tokens |   Δtok |  count |  Δcnt");
  console.log("----------------|--------|-------|---------|--------|--------|------");
  for (const c of CASES) {
    const m = (now[c.name] = await measure(c));
    const p = prev?.[c.name];
    console.log(
      `${c.name.padEnd(15)} | ${String(m.ms).padStart(6)} |${delta(m.ms, p?.ms)} | ${String(m.tokens).padStart(7)} |${delta(m.tokens, p?.tokens)} | ${String(m.count).padStart(6)} |${delta(m.count, p?.count)}`,
    );
  }
  if (!prev) console.log("\nno baseline; run with --save to record one");
  return now;
}

let baseline: Record<string, Metric> | null = existsSync(BASELINE) ? await Bun.file(BASELINE).json() : null;
const result = await sweep(baseline);

if (flags.has("--save") || !baseline) {
  await Bun.write(BASELINE, JSON.stringify(result, null, 2));
  console.log(`\nbaseline written to ${BASELINE}`);
}

if (!flags.has("--watch")) process.exit(0);

console.log(`\nwatching ${SRC}, edit and save to re-measure against the baseline`);
let busy = false;
watch(SRC, { recursive: true }, async (_e, file) => {
  if (busy || !file?.endsWith(".ts")) return;
  busy = true;
  console.log(`\n--- ${file} changed ---`);
  await sweep(baseline).catch((e) => console.error(`bench failed: ${e.message}`));
  busy = false;
});
