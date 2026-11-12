import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { buildDataset, type RawTableSource } from "./build-dataset";
import {
  BLUEPRINTS_DIR,
  DATA_TABLES_DIR,
  GAME_VERSION,
  OUTPUT_DIR,
  PIXEL_ICONS_DIR,
  PUBLIC_ANIMAL_ICONS_DIR,
  PUBLIC_CONSTRUCT_ICONS_DIR,
  PUBLIC_ITEM_ICONS_DIR,
} from "./config";
import { emitDataset } from "./emit";
import { copyIcons, listIconNames } from "./icons";

const fileSource: RawTableSource = {
  async readTable(tableName) {
    const file = path.join(DATA_TABLES_DIR, `${tableName}.json`);
    return JSON.parse(await readFile(file, "utf-8"));
  },
  async readBlueprint(relativePath) {
    return JSON.parse(await readFile(path.join(BLUEPRINTS_DIR, relativePath), "utf-8"));
  },
  async listBlueprints(relativeDirectory) {
    const entries = await readdir(path.join(BLUEPRINTS_DIR, relativeDirectory));
    return entries.filter((file) => file.startsWith("BP_") && file.endsWith(".json")).sort();
  },
};

/** Lists, in full, what has no icon in the icon set (so the owner can supply the files). */
function reportMissing(kind: string, ids: readonly string[]): void {
  if (ids.length === 0) return;
  console.warn(`  ⚠ ${ids.length} ${kind} have no icon in the icon set:`);
  console.warn(`      ${ids.join(", ")}`);
}

/** Flags that still hide content (not in `RELEASED_FEATURE_FLAGS`), with how many entries. */
function countGatingFlags(entries: readonly { featureFlag: string | null }[]) {
  const counts = new Map<string, number>();
  for (const { featureFlag } of entries) {
    if (featureFlag) counts.set(featureFlag, (counts.get(featureFlag) ?? 0) + 1);
  }
  return counts;
}

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
  const itemIcons = await copyIcons(
    dataset.items.map((item) => item.icon),
    PIXEL_ICONS_DIR,
    PUBLIC_ITEM_ICONS_DIR,
  );
  const constructIcons = await copyIcons(
    dataset.constructs.map((construct) => construct.icon),
    PIXEL_ICONS_DIR,
    PUBLIC_CONSTRUCT_ICONS_DIR,
  );
  const animalIcons = await copyIcons(
    dataset.animals.map((animal) => animal.icon),
    PIXEL_ICONS_DIR,
    PUBLIC_ANIMAL_ICONS_DIR,
  );
  const itemsWithoutIcon = dataset.items.filter((item) => item.icon === null).map((i) => i.id);
  const constructsWithoutIcon = dataset.constructs
    .filter((construct) => construct.icon === null)
    .map((c) => c.id);
  const gating = countGatingFlags([...dataset.items, ...dataset.constructs]);
  const { counts } = manifest;

  console.warn(`✔ Emitted to ${OUTPUT_DIR}`);
  console.warn(`  game ${manifest.gameVersion} · data ${manifest.dataVersion}`);
  console.warn(
    `  ${counts.items} items · ${counts.recipes} recipes · ${counts.stations} stations · ${counts.itemSources} item sources · ${counts.constructs} constructs · ${counts.animals} animals`,
  );
  console.warn(
    `  ${itemIcons} item icons · ${constructIcons} construct icons · ${animalIcons} animal icons published`,
  );
  reportMissing("items", itemsWithoutIcon);
  reportMissing("constructs", constructsWithoutIcon);
  for (const [flag, count] of gating) {
    console.warn(`  ⚠ ${count} entries are still hidden by the unconfirmed flag "${flag}"`);
  }
  for (const warning of warnings) console.warn(`  ⚠ ${warning}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
