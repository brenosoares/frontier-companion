import { describe, expect, it } from "vitest";
import type { Construct } from "../domain/construct";
import { JsonConstructRepository } from "./json-construct-repository";

const construct = (id: string, category: Construct["category"]): Construct => ({
  id,
  name: { en: id, "pt-BR": id },
  description: null,
  icon: null,
  category,
  costs: [{ itemId: "Wood", amount: 2 }],
  coziness: 0,
  featureFlag: null,
  blueprintPrice: null,
});

const data = [
  construct("Barrel", "constructs-storage"),
  construct("Silo", "constructs-storage"),
  construct("Chair", "decorations-furniture"),
];

describe("JsonConstructRepository", () => {
  it("finds constructs by id", async () => {
    const repository = new JsonConstructRepository(async () => data);
    expect(await repository.getById("Chair")).toEqual(data[2]);
    expect(await repository.getById("Nope")).toBeNull();
  });

  it("finds the constructs of a category", async () => {
    const repository = new JsonConstructRepository(async () => data);
    const found = await repository.findByCategory("constructs-storage");
    expect(found.map((c) => c.id)).toEqual(["Barrel", "Silo"]);
    expect(await repository.findByCategory("decorations-lights")).toEqual([]);
  });

  it("refuses an unknown category or a non-positive cost", async () => {
    const badCategory = [{ ...data[0], category: "constructs-power" }];
    await expect(new JsonConstructRepository(async () => badCategory).getAll()).rejects.toThrow(
      /Invalid constructs data/,
    );

    const badCost = [{ ...data[0], costs: [{ itemId: "Wood", amount: 0 }] }];
    await expect(new JsonConstructRepository(async () => badCost).getAll()).rejects.toThrow(
      /Invalid constructs data/,
    );
  });
});
