import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildDataset, type RawTableSource } from "./build-dataset";
import {
  DATA_TABLES_DIR,
  GAME_VERSION,
  OUTPUT_DIR,
  PIXEL_ICONS_DIR,
  PUBLIC_ITEM_ICONS_DIR,
} from "./config";
import { emitDataset } from "./emit";
import { copyItemIcons, listIconNames } from "./icons";

const fileSource: RawTableSource = {
  async readTable(tableName) {
    const file = path.join(DATA_TABLES_DIR, `${tableName}.json`);
    return JSON.parse(await readFile(file, "utf-8"));
  },
};

function fail(title: string, lines: readonly string[]): never {
  console.error(`\n✖ ${title} (${lines.length})`);
  for (const line of lines.slice(0, 30)) console.error(`  - ${line}`);
  if (lines.length > 30) console.error(`  … and ${lines.length - 30} more`);
  process.exit(1);
}

async function main(): Promise<void> {
  const iconNames = await listIconNames(PIXEL_ICONS_DIR);
  const { dataset, warnings, integrityIssues, sensitiveFindings } = await buildDataset(
    fileSource,
    iconNames,
  );

  if (integrityIssues.length > 0) fail("Integrity issues", integrityIssues);
  if (sensitiveFindings.length > 0) {
    fail(
      "Sensitive strings found",
      sensitiveFindings.map((f) => `${f.path} [${f.kind}] ${f.sample}`),
    );
  }

  const manifest = await emitDataset(OUTPUT_DIR, dataset, GAME_VERSION);
  const iconCount = await copyItemIcons(dataset.items, PIXEL_ICONS_DIR, PUBLIC_ITEM_ICONS_DIR);
  const withoutIcon = dataset.items.filter((item) => item.icon === null).length;
  const { counts } = manifest;

  console.warn(`✔ Emitted to ${OUTPUT_DIR}`);
  console.warn(`  game ${manifest.gameVersion} · data ${manifest.dataVersion}`);
  console.warn(
    `  ${counts.items} items · ${counts.recipes} recipes · ${counts.stations} stations · ${counts.itemSources} item sources`,
  );
  console.warn(`  ${iconCount} icons published to ${PUBLIC_ITEM_ICONS_DIR}`);
  if (withoutIcon > 0) console.warn(`  ⚠ ${withoutIcon} items have no icon in the icon set`);
  for (const warning of warnings) console.warn(`  ⚠ ${warning}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
