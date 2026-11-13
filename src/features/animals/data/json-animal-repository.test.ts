import { describe, expect, it } from "vitest";
import type { Animal } from "../domain/animal";
import { JsonAnimalRepository } from "./json-animal-repository";

const animal = (id: string): Animal => ({
  id,
  name: { en: id, "pt-BR": id },
  icon: null,
  diet: "Nitrogenic",
  fodderItemId: "CritterFood1",
  wildFeeding: { resourceItemId: "Feather", egg: { itemId: "Egg", chance: 5 } },
  ranch: {
    loot: {
      product: { itemId: "Feather", amount: 1 },
      droppings: { itemId: "NitrogenicDropping", amount: 1 },
    },
    needs: { dailyThirst: 200, dailyHunger: 1, minSquareMeters: 75, minNearbyAnimals: 1 },
    lifecycle: {
      incubationDays: 1,
      growthDays: 2,
      daysSadBeforeRunAway: 3,
      daysRunAwayBeforeDespawn: 7,
    },
  },
});

const wildOnly = (id: string): Animal => ({
  ...animal(id),
  wildFeeding: { resourceItemId: "RedCrystal", egg: null },
  ranch: null,
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

    const ranch = animal("A").ranch!;
    const badSpace = [
      { ...animal("A"), ranch: { ...ranch, needs: { ...ranch.needs, minSquareMeters: 0 } } },
    ];
    await expect(new JsonAnimalRepository(async () => badSpace).getAll()).rejects.toThrow(
      /Invalid animals data/,
    );
  });

  it("accepts creatures that cannot be raised or that leave no egg", async () => {
    const repository = new JsonAnimalRepository(async () => [wildOnly("Znork")]);
    const [znork] = await repository.getAll();

    expect(znork?.ranch).toBeNull();
    expect(znork?.wildFeeding.egg).toBeNull();
  });
});
