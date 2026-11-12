// @vitest-environment node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DatasetManifestSchema } from "@/shared/domain/dataset-manifest";
import { JsonItemRepository } from "@/features/items/data/json-item-repository";
import { JsonRecipeRepository } from "@/features/recipes/data/json-recipe-repository";
import { GAME_VERSION, OUTPUT_DIR } from "./config";
import { checkIntegrity } from "./quality/integrity";
import { findSensitiveStrings } from "./quality/sanitize";

const read = async (file: string): Promise<unknown> =>
  JSON.parse(await readFile(path.join(OUTPUT_DIR, file), "utf-8"));
const load = (file: string) => () => read(file);

/**
 * Contract test for the COMMITTED curated dataset (`data/processed`). It runs in CI, where the raw
 * dump is unavailable, so a bad hand-edit or stale file fails the build.
 */
describe("committed dataset (data/processed)", () => {
  it("loads through the repositories and is referentially consistent", async () => {
    const items = await new JsonItemRepository(load("items.json")).getAll();
    const recipes = await new JsonRecipeRepository(load("recipes.json")).getAll();

    expect(items.length).toBeGreaterThan(0);
    expect(recipes.length).toBeGreaterThan(0);
    expect(checkIntegrity({ items, recipes })).toEqual([]);
    expect(findSensitiveStrings({ items, recipes })).toEqual([]);
  });

  it("has a manifest matching the configured game version and the data", async () => {
    const manifest = DatasetManifestSchema.parse(await read("manifest.json"));
    const items = (await read("items.json")) as unknown[];
    const recipes = (await read("recipes.json")) as unknown[];

    expect(manifest.gameVersion).toBe(GAME_VERSION);
    expect(manifest.counts).toEqual({ items: items.length, recipes: recipes.length });
  });
});
