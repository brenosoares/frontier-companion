import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { buildDataset, type RawTableSource } from "./build-dataset";
import { DATA_TABLES_DIR, GAME_VERSION, ICONS_DIR, OUTPUT_DIR } from "./config";
import { emitDataset } from "./emit";
import type { Dataset } from "./quality/integrity";

const fileSource: RawTableSource = {
  async readTable(tableName) {
    const file = path.join(DATA_TABLES_DIR, `${tableName}.json`);
    return JSON.parse(await readFile(file, "utf-8"));
  },
};

async function findMissingIcons({ items }: Dataset): Promise<string[]> {
  const available = new Set((await readdir(ICONS_DIR)).map((file) => path.parse(file).name));
  return items.flatMap((item) => (item.icon && !available.has(item.icon) ? [item.id] : []));
}

function fail(title: string, lines: readonly string[]): never {
  console.error(`\n✖ ${title} (${lines.length})`);
  for (const line of lines.slice(0, 30)) console.error(`  - ${line}`);
  if (lines.length > 30) console.error(`  … and ${lines.length - 30} more`);
  process.exit(1);
}

async function main(): Promise<void> {
  const { dataset, integrityIssues, sensitiveFindings } = await buildDataset(fileSource);

  if (integrityIssues.length > 0) fail("Integrity issues", integrityIssues);
  if (sensitiveFindings.length > 0) {
    fail(
      "Sensitive strings found",
      sensitiveFindings.map((f) => `${f.path} [${f.kind}] ${f.sample}`),
    );
  }

  const manifest = await emitDataset(OUTPUT_DIR, dataset, GAME_VERSION);
  const missingIcons = await findMissingIcons(dataset);

  console.warn(`✔ Emitted to ${OUTPUT_DIR}`);
  console.warn(`  game ${manifest.gameVersion} · data ${manifest.dataVersion}`);
  console.warn(`  ${manifest.counts.items} items · ${manifest.counts.recipes} recipes`);
  if (missingIcons.length > 0) {
    console.warn(`  ⚠ ${missingIcons.length} items reference icons missing from the dump`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
