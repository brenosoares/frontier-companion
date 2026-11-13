// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Animal } from "@/features/animals/domain/animal";
import type { Construct } from "@/features/constructs/domain/construct";
import type { Item } from "@/features/items/domain/item";
import type { ItemSource } from "@/features/items/domain/item-source";
import type { Recipe } from "@/features/recipes/domain/recipe";
import type { Station } from "@/features/recipes/domain/station";
import { checkIntegrity } from "./integrity";

const item = (id: string): Item => ({
  id,
  name: { en: id, "pt-BR": id },
  description: null,
  tags: [],
  weight: 1,
  sellValue: 1,
  icon: null,
  featureFlag: null,
  isVirtual: false,
});

const itemSource = (sourceId: string, itemId: string): ItemSource => ({
  id: `node:${sourceId}:${itemId}`,
  itemId,
  kind: "node",
  sourceId,
  sourceName: { en: sourceId, "pt-BR": sourceId },
  minAmount: 1,
  maxAmount: 1,
  chance: 100,
  price: null,
});

const incubator = {
  lensChances: { smaller: 25, larger: 25, double: 10, rare: 10 },
  rareEggIncubationDays: 5,
};

const animal = (id: string, itemId = "Ore"): Animal => ({
  id,
  name: { en: id, "pt-BR": id },
  icon: null,
  diet: "Potassic",
  fodderItemId: itemId,
  loot: {
    product: { itemId, amount: 1 },
    droppings: { itemId, amount: 1 },
    egg: { itemId },
  },
  wildFeeding: { resourceItemId: itemId, eggChance: 5 },
  needs: { dailyThirst: 100, dailyHunger: 1, minSquareMeters: 50, minNearbyAnimals: 1 },
  lifecycle: {
    incubationDays: 1,
    growthDays: 1,
    daysSadBeforeRunAway: 3,
    daysRunAwayBeforeDespawn: 7,
  },
});

const station = (id: string, family = id): Station => ({
  id,
  family,
  name: { en: id, "pt-BR": id },
});

const construct = (id: string, costItemId: string): Construct => ({
  id,
  name: { en: id, "pt-BR": id },
  description: null,
  icon: null,
  category: "constructs-storage",
  costs: [{ itemId: costItemId, amount: 1 }],
  coziness: 0,
  featureFlag: null,
  blueprintPrice: null,
});

const recipe = (id: string, output: string, inputs: string[], stations: string[] = []): Recipe => ({
  id,
  output: { itemId: output, amount: 1 },
  inputs: inputs.map((itemId) => ({ itemId, amount: 1 })),
  timeSeconds: 0,
  bookLevel: 0,
  stations,
});

describe("checkIntegrity", () => {
  it("passes a consistent dataset", () => {
    const issues = checkIntegrity({
      items: [item("Ore"), item("Bar")],
      recipes: [recipe("Bar1", "Bar", ["Ore"], ["Furnace"])],
      stations: [station("Furnace")],
      itemSources: [itemSource("Rock", "Ore")],
      animals: [],
      incubator,
      mechStats: [],
      mechParts: [],
      mechChips: [],
      constructs: [construct("Box", "Ore")],
    });
    expect(issues).toEqual([]);
  });

  it("reports unknown items in outputs and inputs", () => {
    const issues = checkIntegrity({
      items: [item("Ore")],
      recipes: [recipe("Bar1", "Bar", ["Ghost"], ["Nowhere"])],
      stations: [],
      itemSources: [itemSource("Rock", "Missing")],
      animals: [],
      incubator,
      mechStats: [],
      mechParts: [],
      mechChips: [],
      constructs: [construct("Box", "Nothing")],
    });
    expect(issues).toEqual([
      'Item source "node:Rock:Missing" references unknown item "Missing"',
      'Construct "Box" costs unknown item "Nothing"',
      'Recipe "Bar1" references unknown item "Bar"',
      'Recipe "Bar1" references unknown item "Ghost"',
      'Recipe "Bar1" references unknown station "Nowhere"',
    ]);
  });

  it("reports duplicate ids", () => {
    const issues = checkIntegrity({
      items: [item("Ore"), item("Ore")],
      recipes: [recipe("R", "Ore", []), recipe("R", "Ore", [])],
      stations: [station("S"), station("S")],
      itemSources: [itemSource("Rock", "Ore"), itemSource("Rock", "Ore")],
      animals: [],
      incubator,
      mechStats: [],
      mechParts: [],
      mechChips: [],
      constructs: [construct("Box", "Ore"), construct("Box", "Ore")],
    });
    expect(issues).toContain('Duplicate item id "Ore"');
    expect(issues).toContain('Duplicate recipe id "R"');
    expect(issues).toContain('Duplicate station id "S"');
    expect(issues).toContain('Duplicate item source id "node:Rock:Ore"');
    expect(issues).toContain('Duplicate construct id "Box"');
  });

  it("reports a station whose family does not exist", () => {
    const issues = checkIntegrity({
      items: [],
      recipes: [],
      stations: [station("Furnace3", "Furnace")],
      itemSources: [],
      animals: [],
      incubator,
      mechStats: [],
      mechParts: [],
      mechChips: [],
      constructs: [],
    });
    expect(issues).toEqual(['Station "Furnace3" belongs to unknown family "Furnace"']);
  });

  it("reports a mutation whose seeds do not exist", () => {
    const mutation = { ...itemSource("Seeds", "Ore"), kind: "mutation" as const };
    const issues = checkIntegrity({
      items: [item("Ore")],
      recipes: [],
      stations: [],
      itemSources: [mutation],
      animals: [],
      incubator,
      mechStats: [],
      mechParts: [],
      mechChips: [],
      constructs: [],
    });
    expect(issues).toEqual(['Item source "node:Seeds:Ore" grows from unknown seed "Seeds"']);
  });

  it("reports an animal that points at items which do not exist, and duplicate animals", () => {
    const issues = checkIntegrity({
      items: [item("Ore")],
      recipes: [],
      stations: [],
      itemSources: [],
      constructs: [],
      animals: [animal("Tookan", "Ghost"), animal("Tookan", "Ore")],
      incubator,
      mechStats: [],
      mechParts: [],
      mechChips: [],
    });

    expect(issues).toContain('Duplicate animal id "Tookan"');
    expect(issues).toContain('Animal "Tookan" has unknown fodder item "Ghost"');
    expect(issues).toContain('Animal "Tookan" has unknown egg item "Ghost"');
  });
});
