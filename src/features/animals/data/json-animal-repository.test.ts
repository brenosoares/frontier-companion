import { describe, expect, it } from "vitest";
import type { Animal } from "../domain/animal";
import { JsonAnimalRepository } from "./json-animal-repository";

const animal = (id: string): Animal => ({
  id,
  name: { en: id, "pt-BR": id },
  icon: null,
  diet: "Nitrogenic",
  fodderItemId: "CritterFood1",
  loot: {
    product: { itemId: "Feather", amount: 1 },
    droppings: { itemId: "NitrogenicDropping", amount: 1 },
    egg: { itemId: "Egg" },
  },
  wildFeeding: { resourceItemId: "Feather", eggChance: 5 },
  needs: { dailyThirst: 200, dailyHunger: 1, minSquareMeters: 75, minNearbyAnimals: 1 },
  lifecycle: {
    incubationDays: 1,
    growthDays: 2,
    daysSadBeforeRunAway: 3,
    daysRunAwayBeforeDespawn: 7,
  },
});

describe("JsonAnimalRepository", () => {
  it("lists animals and finds one by id", async () => {
    const repository = new JsonAnimalRepository(async () => [animal("Crob"), animal("Mox")]);

    expect((await repository.getAll()).map((a) => a.id)).toEqual(["Crob", "Mox"]);
    expect(await repository.getById("Mox")).toEqual(animal("Mox"));
    expect(await repository.getById("Nope")).toBeNull();
  });

  it("refuses an unknown diet or a non-positive space", async () => {
    const badDiet = [{ ...animal("A"), diet: "Sugary" }];
    await expect(new JsonAnimalRepository(async () => badDiet).getAll()).rejects.toThrow(
      /Invalid animals data/,
    );

    const badSpace = [{ ...animal("A"), needs: { ...animal("A").needs, minSquareMeters: 0 } }];
    await expect(new JsonAnimalRepository(async () => badSpace).getAll()).rejects.toThrow(
      /Invalid animals data/,
    );
  });
});
