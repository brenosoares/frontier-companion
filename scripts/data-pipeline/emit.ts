import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DatasetManifest } from "@/shared/domain/dataset-manifest";
import type { Dataset } from "./quality/integrity";

const toJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}
`;

/** One JSON file per collection; the file name is the key. */
const COLLECTIONS = [
  ["items", "items.json"],
  ["recipes", "recipes.json"],
  ["stations", "stations.json"],
  ["itemSources", "item-sources.json"],
  ["constructs", "constructs.json"],
  ["animals", "animals.json"],
  ["mechStats", "mech-stats.json"],
  ["mechParts", "mech-parts.json"],
  ["mechChips", "mech-chips.json"],
  ["plants", "plants.json"],
  ["plantEffects", "plant-effects.json"],
  ["qualityRates", "quality-rates.json"],
] as const satisfies readonly (readonly [keyof Dataset, string])[];

export function buildManifest(dataset: Dataset, gameVersion: string): DatasetManifest {
  const hash = createHash("sha256");
  for (const [name] of COLLECTIONS) hash.update(toJson(dataset[name]));
  hash.update(toJson(dataset.incubator));

  return {
    schemaVersion: 1,
    gameVersion,
    dataVersion: hash.digest("hex").slice(0, 12),
    counts: {
      items: dataset.items.length,
      recipes: dataset.recipes.length,
      stations: dataset.stations.length,
      itemSources: dataset.itemSources.length,
      constructs: dataset.constructs.length,
      animals: dataset.animals.length,
      mechParts: dataset.mechParts.length,
      mechChips: dataset.mechChips.length,
      plants: dataset.plants.length,
      plantEffects: dataset.plantEffects.length,
      qualityRates: dataset.qualityRates.length,
    },
  };
}

export async function emitDataset(
  outDir: string,
  dataset: Dataset,
  gameVersion: string,
): Promise<DatasetManifest> {
  const manifest = buildManifest(dataset, gameVersion);
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    ...COLLECTIONS.map(([name, file]) => writeFile(path.join(outDir, file), toJson(dataset[name]))),
    writeFile(path.join(outDir, "incubator.json"), toJson(dataset.incubator)),
    writeFile(path.join(outDir, "manifest.json"), toJson(manifest)),
  ]);
  return manifest;
}
