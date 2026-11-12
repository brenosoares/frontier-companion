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
] as const satisfies readonly (readonly [keyof Dataset, string])[];

export function buildManifest(dataset: Dataset, gameVersion: string): DatasetManifest {
  const hash = createHash("sha256");
  for (const [name] of COLLECTIONS) hash.update(toJson(dataset[name]));

  return {
    schemaVersion: 1,
    gameVersion,
    dataVersion: hash.digest("hex").slice(0, 12),
    counts: {
      items: dataset.items.length,
      recipes: dataset.recipes.length,
      stations: dataset.stations.length,
      itemSources: dataset.itemSources.length,
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
    writeFile(path.join(outDir, "manifest.json"), toJson(manifest)),
  ]);
  return manifest;
}
