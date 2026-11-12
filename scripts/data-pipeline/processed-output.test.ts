// @vitest-environment node
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DatasetManifestSchema } from "@/shared/domain/dataset-manifest";
import { JsonConstructRepository } from "@/features/constructs/data/json-construct-repository";
import { JsonItemSourceRepository } from "@/features/items/data/json-item-source-repository";
import { CONSTRUCT_CATEGORIES } from "@/features/constructs/domain/construct";
import { JsonItemRepository } from "@/features/items/data/json-item-repository";
import { JsonStationRepository } from "@/features/recipes/data/json-station-repository";
import { JsonRecipeRepository } from "@/features/recipes/data/json-recipe-repository";
import { visibleTags } from "@/features/items/domain/item-list";
import { LOCALES } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import {
  GAME_VERSION,
  OUTPUT_DIR,
  PUBLIC_CONSTRUCT_ICONS_DIR,
  PUBLIC_ITEM_ICONS_DIR,
} from "./config";
import { checkIntegrity } from "./quality/integrity";
import { isUnfinished } from "./quality/unfinished";
import { findSensitiveStrings } from "./quality/sanitize";

const read = async (file: string): Promise<unknown> =>
  JSON.parse(await readFile(path.join(OUTPUT_DIR, file), "utf-8"));
const load = (file: string) => () => read(file);

async function readAllSources() {
  const items = await new JsonItemRepository(load("items.json")).getAll();
  const repository = new JsonItemSourceRepository(load("item-sources.json"));
  return (await Promise.all(items.map((item) => repository.findByItem(item.id)))).flat();
}

/**
 * Contract test for the COMMITTED curated dataset (`data/processed`). It runs in CI, where the raw
 * dump is unavailable, so a bad hand-edit or stale file fails the build.
 */
describe("committed dataset (data/processed)", () => {
  it("loads through the repositories and is referentially consistent", async () => {
    const items = await new JsonItemRepository(load("items.json")).getAll();
    const recipes = await new JsonRecipeRepository(load("recipes.json")).getAll();
    const stations = await new JsonStationRepository(load("stations.json")).getAll();
    const itemSources = await readAllSources();
    const constructs = await new JsonConstructRepository(load("constructs.json")).getAll();

    expect(items.length).toBeGreaterThan(0);
    expect(recipes.length).toBeGreaterThan(0);
    expect(stations.length).toBeGreaterThan(0);
    expect(checkIntegrity({ items, recipes, stations, itemSources, constructs })).toEqual([]);
    expect(findSensitiveStrings({ items, recipes, stations, itemSources, constructs })).toEqual([]);
  });

  it("has a manifest matching the configured game version and the data", async () => {
    const manifest = DatasetManifestSchema.parse(await read("manifest.json"));
    const items = (await read("items.json")) as unknown[];
    const recipes = (await read("recipes.json")) as unknown[];
    const stations = (await read("stations.json")) as unknown[];
    const itemSources = (await read("item-sources.json")) as unknown[];
    const constructs = (await read("constructs.json")) as unknown[];

    expect(manifest.gameVersion).toBe(GAME_VERSION);
    expect(manifest.counts).toEqual({
      items: items.length,
      recipes: recipes.length,
      stations: stations.length,
      itemSources: itemSources.length,
      constructs: constructs.length,
    });
  });

  it("has a UI label, in every locale, for every item tag a player can see", async () => {
    const items = await new JsonItemRepository(load("items.json")).getAll();
    const tags = new Set(items.flatMap((item) => visibleTags(item.tags)));

    for (const locale of LOCALES) {
      const labels: Record<string, string> = getMessages(locale).items.tags;
      const missing = [...tags].filter((tag) => !(tag in labels));
      expect({ locale, missing }).toEqual({ locale, missing: [] });
    }
  });

  it("publishes a PNG for every item icon", async () => {
    const items = await new JsonItemRepository(load("items.json")).getAll();
    const icons = [...new Set(items.flatMap((item) => (item.icon ? [item.icon] : [])))];

    expect(icons.length).toBeGreaterThan(0);
    const missing: string[] = [];
    for (const icon of icons) {
      await access(path.join(PUBLIC_ITEM_ICONS_DIR, `${icon}.png`)).catch(() => missing.push(icon));
    }
    expect(missing).toEqual([]);
  });

  it("contains no unfinished (Wip) content", async () => {
    const files = [
      "items.json",
      "recipes.json",
      "stations.json",
      "item-sources.json",
      "constructs.json",
    ];
    for (const file of files) {
      const text = JSON.stringify(await read(file));
      expect({ file, unfinished: isUnfinished(text) }).toEqual({ file, unfinished: false });
    }
  });

  it("publishes a PNG for every construct icon", async () => {
    const constructs = await new JsonConstructRepository(load("constructs.json")).getAll();
    const icons = [
      ...new Set(constructs.flatMap((construct) => (construct.icon ? [construct.icon] : []))),
    ];

    expect(icons.length).toBeGreaterThan(0);
    const missing: string[] = [];
    for (const icon of icons) {
      await access(path.join(PUBLIC_CONSTRUCT_ICONS_DIR, `${icon}.png`)).catch(() =>
        missing.push(icon),
      );
    }
    expect(missing).toEqual([]);
  });

  it("classifies every construct and keeps each category non-empty", async () => {
    const constructs = await new JsonConstructRepository(load("constructs.json")).getAll();
    const counts = new Map<string, number>();
    for (const { category } of constructs) counts.set(category, (counts.get(category) ?? 0) + 1);

    expect([...counts.keys()].sort()).toEqual([...CONSTRUCT_CATEGORIES].sort());
  });
});
