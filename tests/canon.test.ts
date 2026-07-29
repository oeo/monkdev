import { test, expect } from "bun:test";
import { $ } from "bun";
import { mkdir, rm, writeFile } from "node:fs/promises";

const D = `test_canon_dir_${process.pid}`;

test("canon clusters a fact restated across languages, not within one", async () => {
  await rm(D, { recursive: true, force: true });
  await mkdir(D, { recursive: true });
  await writeFile(`${D}/model.rs`, "pub struct UserAccount {\n  pub tier: String,\n}\npub const TIMEOUT_MS: u64 = 30000;\n");
  await writeFile(`${D}/types.ts`, "export interface UserAccount { plan: string }\nexport const TIMEOUT_MS = 25000;\n");
  await writeFile(`${D}/a.ts`, "export const SOLO_ONLY = 7;\n");
  await writeFile(`${D}/b.ts`, 'import { SOLO_ONLY } from "./a";\nexport const x = SOLO_ONLY;\n');

  try {
    const { stdout } = await $`./bin/monk canon ${D} --json`.quiet();
    const report = JSON.parse(stdout.toString());
    const clusters = report.clusters;
    const keys = clusters.map((c: any) => c.variants.join("|"));

    expect(report.shown).toBe(clusters.length); // json must carry coverage, never a silent cap
    expect(report.total).toBeGreaterThanOrEqual(report.shown);
    expect(report.scanned).toBe(4);

    expect(keys).toContain("UserAccount");
    expect(keys).toContain("TIMEOUT_MS");
    expect(keys.some((k: string) => k.includes("SOLO_ONLY"))).toBe(false); // two files, one language

    const t = clusters.find((c: any) => c.variants[0] === "TIMEOUT_MS");
    expect(t.langs.sort()).toEqual(["rs", "ts"]);
    expect(t.hits.map((h: any) => h.file).sort()).toEqual(["model.rs", "types.ts"]);

    const { stdout: capped } = await $`./bin/monk canon ${D} --max-files 1`.quiet();
    expect(capped.toString()).toContain("0 of 0 clusters shown");
  } finally {
    await rm(D, { recursive: true, force: true });
  }
});
