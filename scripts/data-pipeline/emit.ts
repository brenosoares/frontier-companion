import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Dataset } from "./quality/integrity";

export interface Manifest {
  schemaVersion: 1;
  gameVersion: string;
  /** Content hash: changes only when the emitted data changes (deterministic builds). */
  dataVersion: string;
  counts: { items: number; recipes: number };
}

const toJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export function buildManifest(dataset: Dataset, gameVersion: string): Manifest {
  const hash = createHash("sha256")
    .update(toJson(dataset.items))
    .update(toJson(dataset.recipes))
    .digest("hex");

  return {
    schemaVersion: 1,
    gameVersion,
    dataVersion: hash.slice(0, 12),
    counts: { items: dataset.items.length, recipes: dataset.recipes.length },
  };
}

export async function emitDataset(
  outDir: string,
  dataset: Dataset,
  gameVersion: string,
): Promise<Manifest> {
  const manifest = buildManifest(dataset, gameVersion);
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outDir, "items.json"), toJson(dataset.items)),
    writeFile(path.join(outDir, "recipes.json"), toJson(dataset.recipes)),
    writeFile(path.join(outDir, "manifest.json"), toJson(manifest)),
  ]);
  return manifest;
}
