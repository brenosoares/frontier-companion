import { describe, expect, it } from "vitest";
import type { Plant } from "../domain/plant";
import { JsonPlantRepository } from "./json-plant-repository";

const plant = (id: string): Plant => ({
  id,
  name: { en: id, "pt-BR": id },
  icon: null,
  kind: "crop",
  cropType: "Nitrogenic",
  daysToMature: 3,
  daysToDry: 1,
  seedItemId: `${id}Seeds`,
  drops: [{ itemId: id, minAmount: 1, maxAmount: 1, chance: 100 }],
  fruit: null,
  breakingLevel: null,
});

describe("JsonPlantRepository", () => {
  it("lists plants and finds one by id", async () => {
    const repository = new JsonPlantRepository(async () => [plant("Wheat"), plant("Caroot")]);

    expect((await repository.getAll()).map((p) => p.id)).toEqual(["Wheat", "Caroot"]);
    expect(await repository.getById("Caroot")).toEqual(plant("Caroot"));
    expect(await repository.getById("Nope")).toBeNull();
  });

  it("rejects data that does not match the schema, including a drop with min above max", async () => {
    await expect(new JsonPlantRepository(async () => [{ id: "X" }]).getAll()).rejects.toThrow();

    const bad = plant("Wheat");
    bad.drops = [{ itemId: "Wheat", minAmount: 3, maxAmount: 1, chance: 100 }];
    await expect(new JsonPlantRepository(async () => [bad]).getAll()).rejects.toThrow();
  });
});
