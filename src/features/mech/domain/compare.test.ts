import { describe, expect, it } from "vitest";
import { comparisonRows, costAmount, statValue } from "./compare";
import type { MechPart } from "./mech";

const part = (
  id: string,
  stats: Record<string, number>,
  costs: Record<string, number> = {},
): MechPart => ({
  id,
  name: { en: id, "pt-BR": id },
  description: null,
  icon: null,
  category: "spike-saw",
  tier: 1,
  costs: Object.entries(costs).map(([itemId, amount]) => ({ itemId, amount })),
  stats: Object.entries(stats).map(([stat, value]) => ({ stat, value })),
  featureFlag: null,
});

const saw0 = part("Saw0", { "Health.Max": 1000, Slots: 0 }, { CopperOre: 3 });
const saw1 = part(
  "Saw1",
  { "Health.Max": 1000, Slots: 1, "SpikeSaw.Swing.Damage": 150 },
  { CopperOre: 5, NickelOre: 1 },
);

describe("comparisonRows", () => {
  it("lists every stat and cost item once, in the order they first appear", () => {
    expect(comparisonRows([saw0, saw1])).toEqual({
      statIds: ["Health.Max", "Slots", "SpikeSaw.Swing.Damage"],
      costItemIds: ["CopperOre", "NickelOre"],
    });
  });

  it("is empty for no parts, and for parts with no costs", () => {
    expect(comparisonRows([])).toEqual({ statIds: [], costItemIds: [] });
    expect(comparisonRows([part("Free", { Slots: 1 })]).costItemIds).toEqual([]);
  });
});

describe("statValue and costAmount", () => {
  it("return the part's value, or null when it lacks the stat or item", () => {
    expect(statValue(saw1, "Slots")).toBe(1);
    expect(statValue(saw0, "SpikeSaw.Swing.Damage")).toBeNull();
    expect(costAmount(saw1, "NickelOre")).toBe(1);
    expect(costAmount(saw0, "NickelOre")).toBeNull();
  });

  it("keeps a zero value distinct from a missing one", () => {
    expect(statValue(saw0, "Slots")).toBe(0);
  });
});
