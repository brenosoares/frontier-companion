// @vitest-environment node
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DatasetManifestSchema } from "@/shared/domain/dataset-manifest";
import { PART_CATEGORIES } from "@/features/mech/domain/mech";
import { IncubatorSchema } from "@/features/animals/domain/animal";
import { JsonPlantRepository } from "@/features/plants/data/json-plant-repository";
import { CROP_TYPES, QUALITIES } from "@/features/plants/domain/plant";
import { JsonMechRepository } from "@/features/mech/data/json-mech-repository";
import { JsonAnimalRepository } from "@/features/animals/data/json-animal-repository";
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
  PUBLIC_ANIMAL_ICONS_DIR,
  PUBLIC_MECH_ICONS_DIR,
  PUBLIC_PLANT_ICONS_DIR,
  PUBLIC_CONSTRUCT_ICONS_DIR,
  PUBLIC_ITEM_ICONS_DIR,
} from "./config";
import { RANCH_STRUCTURE_IDS } from "../../src/app/[locale]/animals/ranch-structures";
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
const plantRepo = () =>
  new JsonPlantRepository({
    plants: load("plants.json"),
    effects: load("plant-effects.json"),
    qualityRates: load("quality-rates.json"),
  });

const mechRepository = () =>
  new JsonMechRepository({
    stats: load("mech-stats.json"),
    parts: load("mech-parts.json"),
    chips: load("mech-chips.json"),
  });

describe("committed dataset (data/processed)", () => {
  it("loads through the repositories and is referentially consistent", async () => {
    const items = await new JsonItemRepository(load("items.json")).getAll();
    const recipes = await new JsonRecipeRepository(load("recipes.json")).getAll();
    const stations = await new JsonStationRepository(load("stations.json")).getAll();
    const itemSources = await readAllSources();
    const constructs = await new JsonConstructRepository(load("constructs.json")).getAll();
    const animals = await new JsonAnimalRepository(load("animals.json")).getAll();
    const incubator = IncubatorSchema.parse(await read("incubator.json"));
    const mech = mechRepository();
    const mechStats = await mech.getStats();
    const mechParts = await mech.getParts();
    const mechChips = await mech.getChips();
    const plantRepository = plantRepo();
    const plants = await plantRepository.getAll();
    const plantEffects = await plantRepository.getEffects();
    const qualityRates = await plantRepository.getQualityRates();

    expect(items.length).toBeGreaterThan(0);
    expect(recipes.length).toBeGreaterThan(0);
    expect(stations.length).toBeGreaterThan(0);
    expect(
      checkIntegrity({
        items,
        recipes,
        stations,
        itemSources,
        constructs,
        animals,
        incubator,
        mechStats,
        mechParts,
        mechChips,
        plants,
        plantEffects,
        qualityRates,
      }),
    ).toEqual([]);
    expect(
      findSensitiveStrings({
        items,
        recipes,
        stations,
        itemSources,
        constructs,
        animals,
        incubator,
        mechStats,
        mechParts,
        mechChips,
      }),
    ).toEqual([]);
  });

  it("has a manifest matching the configured game version and the data", async () => {
    const manifest = DatasetManifestSchema.parse(await read("manifest.json"));
    const items = (await read("items.json")) as unknown[];
    const recipes = (await read("recipes.json")) as unknown[];
    const stations = (await read("stations.json")) as unknown[];
    const itemSources = (await read("item-sources.json")) as unknown[];
    const constructs = (await read("constructs.json")) as unknown[];
    const animals = (await read("animals.json")) as unknown[];
    const mechParts = (await read("mech-parts.json")) as unknown[];
    const mechChips = (await read("mech-chips.json")) as unknown[];
    const plants = (await read("plants.json")) as unknown[];
    const plantEffects = (await read("plant-effects.json")) as unknown[];
    const qualityRates = (await read("quality-rates.json")) as unknown[];

    expect(manifest.gameVersion).toBe(GAME_VERSION);
    expect(manifest.counts).toEqual({
      items: items.length,
      recipes: recipes.length,
      stations: stations.length,
      itemSources: itemSources.length,
      constructs: constructs.length,
      animals: animals.length,
      mechParts: mechParts.length,
      mechChips: mechChips.length,
      plants: plants.length,
      plantEffects: plantEffects.length,
      qualityRates: qualityRates.length,
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
      "animals.json",
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

  it("publishes a PNG for every animal icon", async () => {
    const animals = await new JsonAnimalRepository(load("animals.json")).getAll();
    const icons = animals.flatMap((animal) => (animal.icon ? [animal.icon] : []));

    expect(icons.length).toBeGreaterThan(0);
    const missing: string[] = [];
    for (const icon of icons) {
      await access(path.join(PUBLIC_ANIMAL_ICONS_DIR, `${icon}.png`)).catch(() =>
        missing.push(icon),
      );
    }
    expect(missing).toEqual([]);
  });

  it("only lists ranch structures that exist in the dataset", async () => {
    const constructs = await new JsonConstructRepository(load("constructs.json")).getAll();
    const known = new Set(constructs.map((construct) => construct.id));

    expect(RANCH_STRUCTURE_IDS.filter((id) => !known.has(id))).toEqual([]);
  });

  it("every animal has a label for its diet in every locale", async () => {
    const animals = await new JsonAnimalRepository(load("animals.json")).getAll();
    for (const locale of LOCALES) {
      const diets: Record<string, string> = getMessages(locale).animals.diets;
      const missing = animals.filter((animal) => !(animal.diet in diets)).map((a) => a.id);
      expect({ locale, missing }).toEqual({ locale, missing: [] });
    }
  });

  it("has a UI label, in every locale, for every mech part category", async () => {
    const parts = await mechRepository().getParts();
    const categories = new Set([...parts.map((part) => part.category), ...PART_CATEGORIES]);

    for (const locale of LOCALES) {
      const labels: Record<string, string> = getMessages(locale).mech.categories;
      expect([...categories].filter((category) => !(category in labels))).toEqual([]);
    }
  });

  it("only lists parts and chips whose icons are published", async () => {
    const mech = mechRepository();
    const entries = [...(await mech.getParts()), ...(await mech.getChips())];
    const icons = entries.flatMap((entry) => (entry.icon ? [entry.icon] : []));

    expect(icons.length).toBeGreaterThan(0);
    const missing: string[] = [];
    for (const icon of icons) {
      await access(path.join(PUBLIC_MECH_ICONS_DIR, `${icon}.png`)).catch(() => missing.push(icon));
    }
    expect(missing).toEqual([]);
  });

  it("covers every tier of every category, in order, with the mech parts the game ships", async () => {
    const parts = await mechRepository().getParts();
    for (const category of PART_CATEGORIES) {
      const tiers = parts.filter((part) => part.category === category).map((part) => part.tier);
      expect(tiers.length).toBeGreaterThan(0);
      expect(tiers).toEqual(tiers.map((_, index) => index + 1));
    }
  });

  it("has a UI label, in every locale, for every crop type and plant group", async () => {
    const plants = await plantRepo().getAll();
    for (const locale of LOCALES) {
      const { types, groups } = getMessages(locale).plants;
      const typeLabels: Record<string, string> = types;
      const groupLabels: Record<string, string> = groups;
      expect(CROP_TYPES.filter((type) => !(type in typeLabels))).toEqual([]);
      expect(plants.filter((plant) => !(plant.kind in groupLabels)).map((p) => p.id)).toEqual([]);
    }
  });

  it("publishes a PNG for every plant icon", async () => {
    const plants = await plantRepo().getAll();
    const icons = plants.flatMap((plant) => (plant.icon ? [plant.icon] : []));

    expect(icons.length).toBeGreaterThan(0);
    const missing: string[] = [];
    for (const icon of icons) {
      await access(path.join(PUBLIC_PLANT_ICONS_DIR, `${icon}.png`)).catch(() =>
        missing.push(icon),
      );
    }
    expect(missing).toEqual([]);
  });

  it("has a UI label, in every locale, for every plant effect and harvest quality", async () => {
    const effects = await plantRepo().getEffects();
    for (const locale of LOCALES) {
      const { reagents, quality } = getMessages(locale).plants.fertilizing;
      const effectLabels: Record<string, string> = reagents.effects;
      const qualityLabels: Record<string, string> = quality.qualities;
      expect(effects.filter((entry) => !(entry.effect in effectLabels)).map((e) => e.id)).toEqual(
        [],
      );
      expect(QUALITIES.filter((q) => !(q in qualityLabels))).toEqual([]);
    }
  });

  it("has a baseline quality level whose harvest is always average", async () => {
    const rates = await plantRepo().getQualityRates();
    const baseline = rates.find((rate) => rate.level === 0);
    expect(baseline?.rates).toEqual({ poor: 0, average: 100, fine: 0, exquisite: 0 });
    expect(rates.map((rate) => rate.level)).toEqual(
      [...rates.map((r) => r.level)].sort((a, b) => a - b),
    );
  });
});
