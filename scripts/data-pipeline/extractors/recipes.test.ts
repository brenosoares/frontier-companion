// @vitest-environment node
import { describe, expect, it } from "vitest";
import { rawRecipe } from "../__fixtures__/tables";
import { extractRecipes } from "./recipes";

const composite = {
  TestBar1: rawRecipe("TestBar", { TestOre: 2, TestWood: 1 }, 120),
  TestPlank1: rawRecipe("TestPlank", { TestWood: 1 }),
};

describe("extractRecipes", () => {
  it("cleans GUID keys and maps output/inputs", () => {
    const [recipe] = extractRecipes(composite, { Furnace: { TestBar1: composite.TestBar1 } });

    expect(recipe).toEqual({
      id: "TestBar1",
      output: { itemId: "TestBar", amount: 1 },
      inputs: [
        { itemId: "TestOre", amount: 2 },
        { itemId: "TestWood", amount: 1 },
      ],
      timeSeconds: 120,
      bookLevel: 0,
      stations: ["Furnace"],
    });
  });

  it("leaves stations empty when no station table lists the recipe", () => {
    const recipes = extractRecipes(composite, {});
    expect(recipes.every((recipe) => recipe.stations.length === 0)).toBe(true);
  });

  it("collects every station that lists a recipe, sorted", () => {
    const [recipe] = extractRecipes(composite, {
      Furnace3: { TestBar1: {} },
      Furnace: { TestBar1: {} },
    });
    expect(recipe?.stations).toEqual(["Furnace", "Furnace3"]);
  });

  it("throws when a station lists a recipe missing from the composite table", () => {
    expect(() => extractRecipes(composite, { Furnace: { Ghost: {} } })).toThrow(/unknown recipe/);
  });

  it("throws a named error for a malformed recipe", () => {
    expect(() => extractRecipes({ Broken: { Time: "fast" } }, {})).toThrow(/Recipe "Broken"/);
  });

  it("rejects a recipe with a non-positive amount", () => {
    expect(() => extractRecipes({ Zero: rawRecipe("TestBar", { TestOre: 0 }) }, {})).toThrow();
  });
});
