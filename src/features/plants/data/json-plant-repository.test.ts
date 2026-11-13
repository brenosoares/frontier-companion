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

const rates = [
  { id: "1", level: 1, rates: { poor: 0, average: 70, fine: 25, exquisite: 5 } },
  { id: "-1", level: -1, rates: { poor: 20, average: 80, fine: 0, exquisite: 0 } },
];

const repository = (plants: unknown, effects: unknown = [], qualityRates: unknown = rates) =>
  new JsonPlantRepository({
    plants: async () => plants,
    effects: async () => effects,
    qualityRates: async () => qualityRates,
  });

describe("JsonPlantRepository", () => {
  it("lists plants and finds one by id", async () => {
    const plants = repository([plant("Wheat"), plant("Caroot")]);

    expect((await plants.getAll()).map((p) => p.id)).toEqual(["Wheat", "Caroot"]);
    expect(await plants.getById("Caroot")).toEqual(plant("Caroot"));
    expect(await plants.getById("Nope")).toBeNull();
  });

  it("rejects data that does not match the schema, including a drop with min above max", async () => {
    await expect(repository([{ id: "X" }]).getAll()).rejects.toThrow();

    const bad = plant("Wheat");
    bad.drops = [{ itemId: "Wheat", minAmount: 3, maxAmount: 1, chance: 100 }];
    await expect(repository([bad]).getAll()).rejects.toThrow();
  });

  it("finds the effect an item has as a reagent", async () => {
    const mulch = repository([], [{ id: "Rabbage", effect: "Growth", potency: 800 }]);

    expect(await mulch.getEffectOf("Rabbage")).toEqual({
      id: "Rabbage",
      effect: "Growth",
      potency: 800,
    });
    expect(await mulch.getEffectOf("Wheat")).toBeNull();
    expect((await mulch.getEffects()).map((e) => e.id)).toEqual(["Rabbage"]);
  });

  it("lists quality rates from the lowest level up", async () => {
    expect((await repository([]).getQualityRates()).map((rate) => rate.level)).toEqual([-1, 1]);
  });

  it("rejects an unknown effect and rates that do not add up to 100", async () => {
    await expect(
      repository([], [{ id: "X", effect: "Sparkle", potency: 1 }]).getEffects(),
    ).rejects.toThrow();
    const bad = [{ id: "2", level: 2, rates: { poor: 0, average: 50, fine: 0, exquisite: 0 } }];
    await expect(repository([], [], bad).getQualityRates()).rejects.toThrow();
  });
});
