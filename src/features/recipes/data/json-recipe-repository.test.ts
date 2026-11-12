import { describe, expect, it } from "vitest";
import type { Recipe } from "../domain/recipe";
import { JsonRecipeRepository } from "./json-recipe-repository";

const recipe = (id: string, output: string): Recipe => ({
  id,
  output: { itemId: output, amount: 1 },
  inputs: [{ itemId: "TestOre", amount: 2 }],
  timeSeconds: 60,
  bookLevel: 0,
  stations: ["Furnace"],
});

describe("JsonRecipeRepository", () => {
  const data = [recipe("Bar1", "Bar"), recipe("Bar2", "Bar"), recipe("Plank1", "Plank")];

  it("finds recipes by id", async () => {
    const repository = new JsonRecipeRepository(async () => data);
    expect(await repository.getById("Plank1")).toEqual(data[2]);
    expect(await repository.getById("nope")).toBeNull();
  });

  it("finds every recipe producing an item", async () => {
    const repository = new JsonRecipeRepository(async () => data);
    const found = await repository.findByOutput("Bar");
    expect(found.map((r) => r.id)).toEqual(["Bar1", "Bar2"]);
    expect(await repository.findByOutput("Unknown")).toEqual([]);
  });

  it("refuses malformed data", async () => {
    const repository = new JsonRecipeRepository(async () => [{ id: "X" }]);
    await expect(repository.getAll()).rejects.toThrow(/Invalid recipes data/);
  });
});
