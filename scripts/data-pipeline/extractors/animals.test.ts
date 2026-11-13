// @vitest-environment node
import { describe, expect, it } from "vitest";
import { rawText } from "../__fixtures__/tables";
import { extractAnimals } from "./animals";
import type { WildFeeding } from "./blueprints";

const ranch = (overrides: Record<string, unknown> = {}) => ({
  EngineName: "Tookan",
  DailyThirst: 200,
  DailyHunger: 1,
  MinSquareMeters: 75,
  MinNearbyAnimals: 1,
  IncubationDays: 2,
  GrowthDays: 3,
  DaysSadBeforeRunAway: 3,
  DaysRunAwayBeforeDespawn: 7,
  ItemDrop: { ItemName: "Feather", Count: 2 },
  Dropping: { ItemName: "PotassicDropping", Count: 1 },
  EggItem: "TookanEgg",
  Icon: { AssetPathName: "/Game/Graphics/UI/Icons/T_TookanIcon.T_TookanIcon" },
  ...overrides,
});

const critter = (diet = "EDietType::Potassic") => ({
  DisplayName: rawText("Swiftplume", "Plumaleve"),
  Diet: diet,
});

const food = {
  CritterFood1: { DietType: "EDietType::Nitrogenic" },
  CritterFood3: { DietType: "EDietType::Potassic" },
};

const options = {
  availableIcons: new Set(["TookanIcon"]),
  wildFeeding: new Map([
    ["Tookan", { resourceItemId: "Feather", egg: { itemId: "TookanEgg", chance: 5 } }],
  ]),
  eggToAnimal: new Map([["TookanEgg", "Tookan"]]),
};

describe("extractAnimals", () => {
  it("joins the ranch stats, the critter's name and diet, and the fodder of that diet", () => {
    const [animal] = extractAnimals({ Tookan: ranch() }, { Tookan: critter() }, food, options);

    expect(animal).toEqual({
      id: "Tookan",
      name: { en: "Swiftplume", "pt-BR": "Plumaleve" },
      icon: "TookanIcon",
      diet: "Potassic",
      fodderItemId: "CritterFood3",
      wildFeeding: { resourceItemId: "Feather", egg: { itemId: "TookanEgg", chance: 5 } },
      ranch: {
        loot: {
          product: { itemId: "Feather", amount: 2 },
          droppings: { itemId: "PotassicDropping", amount: 1 },
        },
        needs: { dailyThirst: 200, dailyHunger: 1, minSquareMeters: 75, minNearbyAnimals: 1 },
        lifecycle: {
          incubationDays: 2,
          growthDays: 3,
          daysSadBeforeRunAway: 3,
          daysRunAwayBeforeDespawn: 7,
        },
      },
    });
  });

  it("keeps the dropping the game gives even when it differs from the diet", () => {
    const odd = ranch({ Dropping: { ItemName: "PhosphoricDropping", Count: 1 } });
    const [animal] = extractAnimals({ Tookan: odd }, { Tookan: critter() }, food, options);

    expect(animal?.diet).toBe("Potassic");
    expect(animal?.ranch?.loot.droppings.itemId).toBe("PhosphoricDropping");
  });

  it("uses a null icon when the file is not in the icon set", () => {
    const [animal] = extractAnimals({ Tookan: ranch() }, { Tookan: critter() }, food, {
      ...options,
      availableIcons: new Set(),
    });
    expect(animal?.icon).toBeNull();
  });

  it("lists every critter, sorted by id, with ranch data only for the ones that have it", () => {
    const rows = { Mox: ranch({ EggItem: "MoxEgg" }), Crob: ranch({ EggItem: "CrobEgg" }) };
    const critters = { Mox: critter(), Crob: critter(), Znork: critter("EDietType::Nitrogenic") };
    const feeding = (itemId: string) => ({
      resourceItemId: "Feather",
      egg: { itemId, chance: 5 },
    });
    const many = {
      ...options,
      wildFeeding: new Map<string, WildFeeding>([
        ["Mox", feeding("MoxEgg")],
        ["Crob", feeding("CrobEgg")],
        ["Znork", { resourceItemId: "RedCrystal", egg: null }],
      ]),
      eggToAnimal: new Map([
        ["MoxEgg", "Mox"],
        ["CrobEgg", "Crob"],
      ]),
    };
    const animals = extractAnimals(rows, critters, food, many);

    expect(animals.map((a) => [a.id, a.ranch !== null])).toEqual([
      ["Crob", true],
      ["Mox", true],
      ["Znork", false],
    ]);
    expect(animals[2]).toMatchObject({
      icon: null,
      fodderItemId: "CritterFood1",
      wildFeeding: { resourceItemId: "RedCrystal", egg: null },
      ranch: null,
    });
  });

  it("fails loudly on a ranch animal that is no critter, a diet without fodder or two fodders for one diet", () => {
    expect(() => extractAnimals({ Tookan: ranch() }, {}, food, options)).toThrow(
      /no critter entry/,
    );
    expect(() =>
      extractAnimals(
        { Tookan: ranch() },
        { Tookan: critter("EDietType::Phosphoric") },
        food,
        options,
      ),
    ).toThrow(/no fodder for diet "Phosphoric"/);
    expect(() =>
      extractAnimals(
        { Tookan: ranch() },
        { Tookan: critter() },
        { ...food, CritterFood9: { DietType: "EDietType::Potassic" } },
        options,
      ),
    ).toThrow(/more than one fodder/);
  });

  it("rejects an unknown diet instead of guessing", () => {
    const rows = { Tookan: ranch() };
    const fodder = { CritterFood7: { DietType: "EDietType::Sugary" } };
    expect(() =>
      extractAnimals(rows, { Tookan: critter("EDietType::Sugary") }, fodder, options),
    ).toThrow();
  });

  it("fails when the wild critter's egg differs from the ranch egg", () => {
    const wildFeeding = new Map([
      ["Tookan", { resourceItemId: "Feather", egg: { itemId: "OtherEgg", chance: 5 } }],
    ]);
    expect(() =>
      extractAnimals({ Tookan: ranch() }, { Tookan: critter() }, food, { ...options, wildFeeding }),
    ).toThrow(/differs from wild egg/);
  });

  it("fails when the incubator does not hatch the egg into that animal", () => {
    expect(() =>
      extractAnimals({ Tookan: ranch() }, { Tookan: critter() }, food, {
        ...options,
        eggToAnimal: new Map(),
      }),
    ).toThrow(/incubator does not hatch/);
  });

  it("fails when an animal has no wild feeding data", () => {
    expect(() =>
      extractAnimals({ Tookan: ranch() }, { Tookan: critter() }, food, {
        ...options,
        wildFeeding: new Map(),
      }),
    ).toThrow(/no wild feeding data/);
  });

  it("fails when a ranch animal has no wild egg at all", () => {
    const wildFeeding = new Map<string, WildFeeding>([
      ["Tookan", { resourceItemId: "Feather", egg: null }],
    ]);
    expect(() =>
      extractAnimals({ Tookan: ranch() }, { Tookan: critter() }, food, { ...options, wildFeeding }),
    ).toThrow(/differs from wild egg "none"/);
  });
});
