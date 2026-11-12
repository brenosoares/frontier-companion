import { describe, expect, it } from "vitest";
import { groupCraftedByFamily } from "./crafted-by-family";
import type { Recipe } from "./recipe";
import type { Station } from "./station";

const station = (id: string, family: string): Station => ({
  id,
  family,
  name: { en: id, "pt-BR": id },
});

const recipe = (
  id: string,
  output: [string, number],
  inputs: Record<string, number>,
  stations: string[],
): Recipe => ({
  id,
  output: { itemId: output[0], amount: output[1] },
  inputs: Object.entries(inputs).map(([itemId, amount]) => ({ itemId, amount })),
  timeSeconds: 60,
  bookLevel: 0,
  stations,
});

const stations = [
  station("Furnace", "Furnace"),
  station("FurnaceTwo", "Furnace"),
  station("Furnace3", "Furnace"),
  station("Loom", "Loom"),
];
const obtainable = () => true;

describe("groupCraftedByFamily", () => {
  it("lists an item once per family, merging its tiers and batch sizes", () => {
    const groups = groupCraftedByFamily(
      [
        recipe("Bar1", ["Bar", 1], { Ore: 1 }, ["Furnace"]),
        recipe("Bar5", ["Bar", 5], { Ore: 5 }, ["FurnaceTwo"]),
        recipe("Bar25", ["Bar", 25], { Ore: 25 }, ["Furnace3"]),
      ],
      stations,
      obtainable,
    );

    expect(groups.get("Furnace")).toEqual([
      {
        itemId: "Bar",
        costs: [{ itemId: "Ore", amount: 1 }],
        yields: 1,
        stationIds: ["Furnace", "FurnaceTwo", "Furnace3"],
      },
    ]);
  });

  it("lists the same item under each family that can make it", () => {
    const groups = groupCraftedByFamily(
      [
        recipe("Cloth1", ["Cloth", 1], { Fiber: 2 }, ["Loom"]),
        recipe("Cloth2", ["Cloth", 1], { Fiber: 2 }, ["Furnace"]),
      ],
      stations,
      obtainable,
    );

    expect([...groups.keys()].sort()).toEqual(["Furnace", "Loom"]);
    expect(groups.get("Loom")?.[0]?.stationIds).toEqual(["Loom"]);
  });

  it("uses the default variant for the cost (avoiding ingredients nobody can get)", () => {
    const groups = groupCraftedByFamily(
      [
        recipe("Seeds2", ["Seeds", 2], { Plant: 1 }, ["Furnace"]),
        recipe("Seeds3", ["Seeds", 3], { Plant_Rare: 1 }, ["Furnace"]),
      ],
      stations,
      (id) => id !== "Plant_Rare",
    );

    expect(groups.get("Furnace")?.[0]).toMatchObject({
      costs: [{ itemId: "Plant", amount: 1 }],
      yields: 2,
    });
  });

  it("ignores recipes without a known station and families without recipes", () => {
    const groups = groupCraftedByFamily(
      [recipe("Orphan", ["Thing", 1], { Ore: 1 }, ["Nowhere"]), recipe("A", ["A", 1], {}, [])],
      stations,
      obtainable,
    );
    expect(groups.size).toBe(0);
  });

  it("keeps different items of a family apart", () => {
    const groups = groupCraftedByFamily(
      [
        recipe("A1", ["A", 1], { Ore: 1 }, ["Furnace"]),
        recipe("B1", ["B", 1], { Ore: 2 }, ["Furnace"]),
      ],
      stations,
      obtainable,
    );
    expect(
      groups
        .get("Furnace")
        ?.map((entry) => entry.itemId)
        .sort(),
    ).toEqual(["A", "B"]);
  });
});
