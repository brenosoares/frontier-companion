// @vitest-environment node
import { describe, expect, it } from "vitest";
import { rawText } from "../__fixtures__/tables";
import { extractPlants } from "./plants";

const counts = (entries: Record<string, number>) =>
  Object.entries(entries).map(([Key, Value]) => ({ Key, Value }));
const drop = (ItemName: string, entries: Record<string, number>) => ({
  ItemName,
  Counts: counts(entries),
});

const crop = (overrides: Record<string, unknown> = {}) => ({
  DisplayName: rawText("Wheat", "Trigo"),
  Type: "ECropType::Nitrogenic",
  DaysToDry: 1,
  DaysToMature: 2,
  PlantDrops: [drop("Wheat", { "1": 100 })],
  Icon: { AssetPathName: "/Game/Graphics/UI/Icons/T_WheatIcon.T_WheatIcon" },
  ...overrides,
});

// Large-plant fields carry the engine's index + GUID suffix, which the extractor removes.
const suffix = "_1_0123456789ABCDEF0123456789ABCDEF";
const large = (fields: Record<string, unknown> = {}) =>
  Object.fromEntries(
    Object.entries({
      DisplayName: rawText("Glo Tree", "Árvore-luz"),
      IsNode: false,
      DaysToDry: 8,
      DaysToMature: 5,
      DaysToGrowFruit: 2,
      MaxLifetimeFruits: 90,
      MinBreakingLevel: 1,
      PlantDrops: [drop("GloWood", { "2": 40, "4": 60 })],
      FruitDrops: [drop("GloFruit", { "1": 100 })],
      Icon: { AssetPathName: "/Game/Graphics/UI/Icons/T_GloTreeIcon.T_GloTreeIcon" },
      ...fields,
    }).map(([key, value]) => [`${key}${suffix}`, value]),
  );

const seeds = { Wheat: { Name: "WheatSeeds" }, GloTree: { Name: "GloSeed" } };
const options = { availableIcons: new Set(["WheatIcon", "GloTreeIcon"]) };

describe("extractPlants", () => {
  it("builds a crop with its type, times, drops, seed and icon", () => {
    const { plants } = extractPlants({ Wheat: crop() }, {}, seeds, options);

    expect(plants).toEqual([
      {
        id: "Wheat",
        name: { en: "Wheat", "pt-BR": "Trigo" },
        icon: "WheatIcon",
        kind: "crop",
        cropType: "Nitrogenic",
        daysToMature: 2,
        daysToDry: 1,
        seedItemId: "WheatSeeds",
        drops: [{ itemId: "Wheat", minAmount: 1, maxAmount: 1, chance: 100 }],
        fruit: null,
        breakingLevel: null,
      },
    ]);
  });

  it("builds a large plant with its fruit and breaking level, summarising weighted drops", () => {
    const [plant] = extractPlants({}, { GloTree: large() }, seeds, options).plants;

    expect(plant).toMatchObject({
      id: "GloTree",
      kind: "large",
      cropType: null,
      seedItemId: "GloSeed",
      breakingLevel: 1,
      drops: [{ itemId: "GloWood", minAmount: 2, maxAmount: 4, chance: 100 }],
      fruit: {
        daysToGrow: 2,
        maxLifetime: 90,
        drops: [{ itemId: "GloFruit", minAmount: 1, maxAmount: 1, chance: 100 }],
      },
    });
  });

  it("keeps a plant with no seed or no fruit, with null instead of a guess", () => {
    const { plants } = extractPlants(
      { Refillite: crop() },
      { Bare: large({ FruitDrops: [] }) },
      {},
      options,
    );
    expect(plants.map((p) => [p.id, p.seedItemId, p.fruit])).toEqual([
      ["Bare", null, null],
      ["Refillite", null, null],
    ]);
  });

  it("leaves out scenery (large plants flagged IsNode)", () => {
    const { plants } = extractPlants({}, { Pine: large({ IsNode: true }) }, seeds, options);
    expect(plants).toEqual([]);
  });

  it("drops unfinished plants with a warning", () => {
    const { plants, warnings } = extractPlants(
      { Test: crop({ DisplayName: rawText("Test [Wip]", "Teste [Wip]") }), Wheat: crop() },
      {},
      seeds,
      options,
    );
    expect(plants.map((p) => p.id)).toEqual(["Wheat"]);
    expect(warnings).toEqual(['Dropped plant "Test": unfinished or obsolete content']);
  });

  it("uses a null icon when the file is not in the icon set", () => {
    const [plant] = extractPlants({ Wheat: crop() }, {}, seeds, {
      availableIcons: new Set(),
    }).plants;
    expect(plant?.icon).toBeNull();
  });

  it("sorts by id and fails on an unknown crop type or an unexpected shape", () => {
    const { plants } = extractPlants({ Zed: crop(), Alpha: crop() }, {}, {}, options);
    expect(plants.map((p) => p.id)).toEqual(["Alpha", "Zed"]);

    expect(() =>
      extractPlants({ A: crop({ Type: "ECropType::Sugary" }) }, {}, {}, options),
    ).toThrow();
    expect(() => extractPlants({ A: { nope: 1 } }, {}, {}, options)).toThrow(/unexpected shape/);
  });
});
