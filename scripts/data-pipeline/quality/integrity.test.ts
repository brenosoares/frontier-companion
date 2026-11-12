// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Item } from "@/features/items/domain/item";
import type { Recipe } from "@/features/recipes/domain/recipe";
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

const recipe = (id: string, output: string, inputs: string[]): Recipe => ({
  id,
  output: { itemId: output, amount: 1 },
  inputs: inputs.map((itemId) => ({ itemId, amount: 1 })),
  timeSeconds: 0,
  bookLevel: 0,
  stations: [],
});

describe("checkIntegrity", () => {
  it("passes a consistent dataset", () => {
    const issues = checkIntegrity({
      items: [item("Ore"), item("Bar")],
      recipes: [recipe("Bar1", "Bar", ["Ore"])],
    });
    expect(issues).toEqual([]);
  });

  it("reports unknown items in outputs and inputs", () => {
    const issues = checkIntegrity({
      items: [item("Ore")],
      recipes: [recipe("Bar1", "Bar", ["Ghost"])],
    });
    expect(issues).toEqual([
      'Recipe "Bar1" references unknown item "Bar"',
      'Recipe "Bar1" references unknown item "Ghost"',
    ]);
  });

  it("reports duplicate ids", () => {
    const issues = checkIntegrity({
      items: [item("Ore"), item("Ore")],
      recipes: [recipe("R", "Ore", []), recipe("R", "Ore", [])],
    });
    expect(issues).toContain('Duplicate item id "Ore"');
    expect(issues).toContain('Duplicate recipe id "R"');
  });
});
