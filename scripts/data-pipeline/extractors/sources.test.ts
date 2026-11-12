// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { ItemSource } from "@/features/items/domain/item-source";
import { rawText } from "../__fixtures__/tables";
import {
  extractAnimalSources,
  extractCarePackageSources,
  extractMerchantSources,
  extractMutationSources,
  extractNodeSources,
  extractPlantSources,
  filterUsableSources,
  reconcileItemIdCase,
  sortSources,
} from "./sources";

const counts = (entries: Record<string, number>) =>
  Object.entries(entries).map(([Key, Value]) => ({ Key, Value }));

const node = (name: string, drops: { ItemName: string; Counts: unknown }[]) => ({
  DisplayName: rawText(name, `${name} PT`),
  Drops: drops,
});

describe("extractNodeSources", () => {
  it("turns weighted quantities into a chance and a quantity range", () => {
    const sources = extractNodeSources({
      Tree: node("Tree", [
        { ItemName: "Fiber", Counts: counts({ "3": 70, "4": 25, "5": 5 }) },
        { ItemName: "Seed", Counts: counts({ "0": 65, "1": 35 }) },
      ]),
    });

    expect(sources).toEqual([
      {
        id: "node:Tree:Fiber",
        itemId: "Fiber",
        kind: "node",
        sourceId: "Tree",
        sourceName: { en: "Tree", "pt-BR": "Tree PT" },
        minAmount: 3,
        maxAmount: 5,
        chance: 100,
        price: null,
      },
      expect.objectContaining({ itemId: "Seed", minAmount: 1, maxAmount: 1, chance: 35 }),
    ]);
  });

  it("does not assume weights sum to 100", () => {
    const [source] = extractNodeSources({
      Rock: node("Rock", [{ ItemName: "Stone", Counts: counts({ "0": 1, "2": 1 }) }]),
    });
    expect(source?.chance).toBe(50);
  });

  it("skips drops that can never yield anything", () => {
    const sources = extractNodeSources({
      Rock: node("Rock", [{ ItemName: "Stone", Counts: counts({ "0": 100 }) }]),
    });
    expect(sources).toEqual([]);
  });

  it("names the broken row on a malformed node", () => {
    expect(() => extractNodeSources({ Bad: { Drops: "nope" } })).toThrow(/Node "Bad"/);
  });
});

describe("extractPlantSources", () => {
  const plant = (name: string, isNode?: boolean) => ({
    DisplayName: rawText(name, name),
    ...(isNode !== undefined && { IsNode: isNode }),
    PlantDrops: [{ ItemName: "Fruit", Counts: counts({ "1": 100 }) }],
  });

  it("reads plants from several tables", () => {
    const sources = extractPlantSources(
      [{ Wheat: plant("Wheat") }, { Bush: plant("Bush") }],
      new Set(),
    );
    expect(sources.map((source) => source.id)).toEqual(["plant:Wheat:Fruit", "plant:Bush:Fruit"]);
    expect(sources.every((source) => source.kind === "plant")).toBe(true);
  });

  it("skips node-like plants already covered by the node table", () => {
    const sources = extractPlantSources(
      [{ Tree: plant("Tree", true), Bush: plant("Bush", true), Wheat: plant("Wheat", false) }],
      new Set(["Tree"]),
    );
    expect(sources.map((source) => source.sourceId)).toEqual(["Bush", "Wheat"]);
  });

  it("understands GUID-suffixed fields from the large-plant table", () => {
    const guid = "0123456789ABCDEF0123456789ABCDEF";
    const sources = extractPlantSources(
      [
        {
          Glo: {
            [`DisplayName_1_${guid}`]: rawText("Glo Tree", "Árvore-luz"),
            [`PlantDrops_2_${guid}`]: [{ ItemName: "GloWood", Counts: counts({ "2": 100 }) }],
          },
        },
      ],
      new Set(),
    );
    expect(sources[0]).toMatchObject({ itemId: "GloWood", sourceName: { "pt-BR": "Árvore-luz" } });
  });
});

describe("extractAnimalSources", () => {
  const animals = {
    Tookan: {
      ItemDrop: { ItemName: "Feather", Count: 2 },
      Dropping: { ItemName: "Droppings", Count: 1 },
    },
  };
  const critters = { Tookan: { DisplayName: rawText("Swiftplume", "Plumaleve") } };

  it("yields a product and droppings, named after the critter", () => {
    const sources = extractAnimalSources(animals, critters);

    expect(sources.map((s) => [s.kind, s.itemId, s.minAmount])).toEqual([
      ["animal-product", "Feather", 2],
      ["animal-droppings", "Droppings", 1],
    ]);
    expect(sources.every((s) => s.sourceName?.["pt-BR"] === "Plumaleve" && s.chance === 100)).toBe(
      true,
    );
  });

  it("fails when the animal has no critter entry to name it", () => {
    expect(() => extractAnimalSources(animals, {})).toThrow(/no critter entry/);
  });
});

describe("filterUsableSources", () => {
  const source = (sourceId: string, itemId: string, name = sourceId): ItemSource => ({
    id: `node:${sourceId}:${itemId}`,
    itemId,
    kind: "node",
    sourceId,
    sourceName: { en: name, "pt-BR": name },
    minAmount: 1,
    maxAmount: 1,
    chance: 100,
    price: null,
  });

  it("keeps good sources and reports the ones it drops", () => {
    const { kept, warnings } = filterUsableSources(
      [
        source("Rock", "Stone"),
        source("Ghost", "Missing"),
        source("Dev", "Stone", "Magnetic Ore Wip"),
        source("Dev2", "Stone", "Bomb Plant [Wip]"),
      ],
      new Set(["Stone"]),
    );

    expect(kept.map((s) => s.sourceId)).toEqual(["Rock"]);
    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toMatch(/unknown item/);
    expect(warnings[1]).toMatch(/unfinished or obsolete/);
  });

  it("does not mistake ordinary words for unfinished content", () => {
    const { kept } = filterUsableSources(
      [source("A", "Stone", "Swipe Tree"), source("B", "Stone", "Wipeout Rock")],
      new Set(["Stone"]),
    );
    expect(kept).toHaveLength(2);
  });
});

describe("sortSources", () => {
  it("orders by id without mutating the input", () => {
    const base = { itemId: "X", kind: "node", sourceName: { en: "n", "pt-BR": "n" } } as const;
    const input: ItemSource[] = [
      {
        ...base,
        id: "node:B:X",
        sourceId: "B",
        minAmount: 1,
        maxAmount: 1,
        chance: 1,
        price: null,
      },
      {
        ...base,
        id: "node:A:X",
        sourceId: "A",
        minAmount: 1,
        maxAmount: 1,
        chance: 1,
        price: null,
      },
    ];
    expect(sortSources(input).map((s) => s.sourceId)).toEqual(["A", "B"]);
    expect(input[0]?.sourceId).toBe("B");
  });
});

describe("plant fruit drops", () => {
  const plant = {
    DisplayName: rawText("Red Colorflower", "Colorflor Vermelha"),
    PlantDrops: [{ ItemName: "Fiber", Counts: counts({ "2": 100 }) }],
    FruitDrops: [{ ItemName: "RedColorflower", Counts: counts({ "1": 100 }) }],
  };

  it("lists what the standing plant grows as its own kind of source", () => {
    const sources = extractPlantSources([{ RedColorflower: plant }], new Set());

    expect(sources.map((source) => [source.kind, source.itemId])).toEqual([
      ["plant", "Fiber"],
      ["plant-fruit", "RedColorflower"],
    ]);
    expect(sources[1]).toMatchObject({ minAmount: 1, maxAmount: 1, chance: 100 });
  });

  it("is fine for plants without fruit", () => {
    const withoutFruit = { DisplayName: plant.DisplayName, PlantDrops: plant.PlantDrops };
    expect(extractPlantSources([{ Wheat: withoutFruit }], new Set())).toHaveLength(1);
  });
});

describe("extractMerchantSources", () => {
  const entry = (Type: string, EntryId: string, Cost: number, Bundle = "Discovery") => ({
    Bundle,
    Type,
    EntryId,
    Cost,
  });

  it("keeps only items, with their price and no invented name, amount or chance", () => {
    const sources = extractMerchantSources({
      "1": entry("EMerchantEntryType::Item", "WheatSeeds", 20, "BundleZero"),
      "2": entry("EMerchantEntryType::Blueprint", "Chair", 400),
      "3": entry("EMerchantEntryType::MechPart", "Arm", 900),
    });

    expect(sources).toEqual([
      {
        id: "merchant:BundleZero:WheatSeeds",
        itemId: "WheatSeeds",
        kind: "merchant",
        sourceId: "BundleZero",
        sourceName: null,
        minAmount: null,
        maxAmount: null,
        chance: null,
        price: 20,
      },
    ]);
  });

  it("keeps the cheapest offer when an item is sold in several bundles", () => {
    const sources = extractMerchantSources({
      "1": entry("EMerchantEntryType::Item", "Wood", 50, "A"),
      "2": entry("EMerchantEntryType::Item", "Wood", 30, "B"),
    });
    expect(sources.map((s) => [s.sourceId, s.price])).toEqual([["B", 30]]);
  });

  it("names a malformed entry", () => {
    expect(() => extractMerchantSources({ "7": { Type: 5 } })).toThrow(/entry "7"/);
  });
});

describe("extractCarePackageSources", () => {
  it("lists the pool of resource packages only, without inventing quantities", () => {
    const sources = extractCarePackageSources({
      Res_Natural: { Kind: "ECarePackageRewardKind::Resources", Pool: ["Stone", "Wood"] },
      Frame: { Kind: "ECarePackageRewardKind::FrameResource", Pool: ["IronFrame"] },
      PowerCores: { Kind: "ECarePackageRewardKind::PowerCores", Pool: [] },
      Chip: { Kind: "ECarePackageRewardKind::ModChip" },
    });

    expect(sources.map((s) => s.id)).toEqual([
      "care-package:Res_Natural:Stone",
      "care-package:Res_Natural:Wood",
      "care-package:Frame:IronFrame",
    ]);
    expect(sources.every((s) => s.minAmount === null && s.chance === null)).toBe(true);
  });
});

describe("extractMutationSources", () => {
  const name = (en: string) => ({ en, "pt-BR": `${en} PT` });
  const items = [
    { id: "Wheat", name: name("Wheat") },
    { id: "Wheat_Rare", name: name("Wheat (Mutated)") },
    { id: "WheatSeeds_Refined", name: name("Spliced Wheat Seeds") },
    { id: "Orphan_Rare", name: name("Orphan (Mutated)") },
  ];

  it("links a mutated crop to its modified seeds, which it names", () => {
    const [source, ...rest] = extractMutationSources(items);

    expect(rest).toEqual([]);
    expect(source).toMatchObject({
      id: "mutation:WheatSeeds_Refined:Wheat_Rare",
      itemId: "Wheat_Rare",
      kind: "mutation",
      sourceId: "WheatSeeds_Refined",
      sourceName: name("Spliced Wheat Seeds"),
    });
  });

  it("skips a mutated crop with no matching seeds instead of guessing", () => {
    expect(extractMutationSources(items).some((s) => s.itemId === "Orphan_Rare")).toBe(false);
  });
});

describe("filterUsableSources with unnamed sources", () => {
  it("keeps merchants and care packages, which have no name to inspect", () => {
    const [merchant] = extractMerchantSources({
      "1": { Bundle: "A", Type: "EMerchantEntryType::Item", EntryId: "Wood", Cost: 5 },
    });
    const { kept, warnings } = filterUsableSources(merchant ? [merchant] : [], new Set(["Wood"]));

    expect(kept).toHaveLength(1);
    expect(warnings).toEqual([]);
  });
});

describe("reconcileItemIdCase", () => {
  const source = (itemId: string): ItemSource => ({
    id: `node:Tree:${itemId}`,
    itemId,
    kind: "node",
    sourceId: "Tree",
    sourceName: null,
    minAmount: null,
    maxAmount: null,
    chance: null,
    price: null,
  });
  const itemIds = new Set(["SoftWoodLog", "Ore"]);

  it("re-points a source whose item id differs only by case", () => {
    const [fixed] = reconcileItemIdCase([source("SoftwoodLog")], itemIds);
    expect(fixed).toMatchObject({ itemId: "SoftWoodLog", id: "node:Tree:SoftWoodLog" });
  });

  it("leaves exact matches and unknown ids alone", () => {
    const sources = [source("Ore"), source("Ghost")];
    expect(reconcileItemIdCase(sources, itemIds)).toEqual(sources);
  });
});
