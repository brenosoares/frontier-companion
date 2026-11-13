import { describe, expect, it } from "vitest";
import type { MechChip, MechPart, MechStat } from "../domain/mech";
import { JsonMechRepository } from "./json-mech-repository";

const stat: MechStat = {
  id: "Health.Max",
  name: { en: "Durability", "pt-BR": "Durabilidade" },
  kind: "number",
};

const part = (id: string): MechPart => ({
  id,
  name: { en: id, "pt-BR": id },
  description: null,
  icon: null,
  category: "engine",
  tier: 1,
  costs: [{ itemId: "CopperOre", amount: 3 }],
  stats: [{ stat: "Health.Max", value: 1000 }],
  featureFlag: null,
});

const chip = (id: string): MechChip => ({
  id,
  name: { en: id, "pt-BR": id },
  description: null,
  icon: null,
  powerCost: 2,
  costs: [],
  fits: ["engine"],
  unique: false,
  featureFlag: null,
});

const repository = (parts: unknown = [part("A"), part("B")], chips: unknown = [chip("X")]) =>
  new JsonMechRepository({
    stats: async () => [stat],
    parts: async () => parts,
    chips: async () => chips,
  });

describe("JsonMechRepository", () => {
  it("lists stats, parts and chips and finds each by id", async () => {
    const mech = repository();

    expect(await mech.getStats()).toEqual([stat]);
    expect((await mech.getParts()).map((p) => p.id)).toEqual(["A", "B"]);
    expect(await mech.getPartById("B")).toEqual(part("B"));
    expect(await mech.getPartById("Nope")).toBeNull();
    expect((await mech.getChips()).map((c) => c.id)).toEqual(["X"]);
    expect(await mech.getChipById("X")).toEqual(chip("X"));
    expect(await mech.getChipById("Nope")).toBeNull();
  });

  it("rejects data that does not match the schemas", async () => {
    await expect(repository([{ id: "A" }]).getParts()).rejects.toThrow();
    await expect(repository([part("A")], [{ id: "X" }]).getChips()).rejects.toThrow();
  });
});
