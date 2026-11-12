// @vitest-environment node
import { describe, expect, it } from "vitest";
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
      constructs: [],
    });
    expect(issues).toEqual(['Station "Furnace3" belongs to unknown family "Furnace"']);
  });
});
