import { describe, expect, it } from "vitest";
import type { Recipe } from "./recipe";
import { toRecipeView } from "./recipe-view";

const recipe: Recipe = {
  id: "Bar1",
  output: { itemId: "Bar", amount: 2 },
  inputs: [
    { itemId: "Ore", amount: 3 },
    { itemId: "Wood", amount: 1 },
  ],
  timeSeconds: 120,
  bookLevel: 2,
  stations: ["Furnace", "Furnace3"],
};

describe("toRecipeView", () => {
  it("resolves item and station ids to names, keeping quantities and order", () => {
    const view = toRecipeView(recipe, {
      itemName: (id) => `item:${id}`,
      stationName: (id) => `station:${id}`,
    });

    expect(view).toEqual({
      id: "Bar1",
      output: { itemId: "Bar", name: "item:Bar", amount: 2 },
      inputs: [
        { itemId: "Ore", name: "item:Ore", amount: 3 },
        { itemId: "Wood", name: "item:Wood", amount: 1 },
      ],
      timeSeconds: 120,
      bookLevel: 2,
      stations: ["station:Furnace", "station:Furnace3"],
    });
  });
});
