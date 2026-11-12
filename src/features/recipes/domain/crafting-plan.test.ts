import { describe, expect, it } from "vitest";
import {
  buildVariantIndex,
  MAX_QUANTITY,
  pickDefaultVariant,
  planCrafting,
  type RecipeVariant,
} from "./crafting-plan";
import type { Recipe } from "./recipe";

const recipe = (
  id: string,
  output: [string, number],
  inputs: Record<string, number>,
  overrides: Partial<Recipe> = {},
): Recipe => ({
  id,
  output: { itemId: output[0], amount: output[1] },
  inputs: Object.entries(inputs).map(([itemId, amount]) => ({ itemId, amount })),
  timeSeconds: 10,
  bookLevel: 0,
  stations: ["Station"],
  ...overrides,
});

const allObtainable = () => true;

describe("buildVariantIndex", () => {
  it("merges batch-size variants (same ingredients per unit) into one, keeping the smallest batch", () => {
    const index = buildVariantIndex([
      recipe("Bar25", ["Bar", 25], { Ore: 25, Wood: 25 }),
      recipe("Bar1", ["Bar", 1], { Wood: 1, Ore: 1 }),
      recipe("Bar5", ["Bar", 5], { Ore: 5, Wood: 5 }),
    ]);

    expect(index.get("Bar")).toHaveLength(1);
    expect(index.get("Bar")?.[0]?.key).toBe("Bar1");
  });

  it("recognises equal ratios that are not written alike (2 for 4 == 1 for 2)", () => {
    const index = buildVariantIndex([
      recipe("A", ["Seeds", 4], { Plant: 2 }),
      recipe("B", ["Seeds", 2], { Plant: 1 }),
    ]);
    expect(index.get("Seeds")?.map((v) => v.key)).toEqual(["B"]);
  });

  it("keeps genuinely different ingredient sets as separate variants", () => {
    const index = buildVariantIndex([
      recipe("Seeds2", ["Seeds", 2], { Plant: 1 }),
      recipe("Seeds3", ["Seeds", 3], { Plant_Rare: 1 }),
      recipe("Seeds10", ["Seeds", 10], { Plant: 5 }),
    ]);
    expect(index.get("Seeds")?.map((v) => v.key)).toEqual(["Seeds2", "Seeds3"]);
  });

  it("indexes each output item separately", () => {
    const index = buildVariantIndex([recipe("A1", ["A", 1], {}), recipe("B1", ["B", 1], {})]);
    expect([...index.keys()].sort()).toEqual(["A", "B"]);
  });
});

describe("pickDefaultVariant", () => {
  const variant = (r: Recipe): RecipeVariant => ({ key: r.id, recipe: r });
  const normal = variant(recipe("Seeds2", ["Seeds", 2], { Plant: 1 }));
  const rare = variant(recipe("Seeds3", ["Seeds", 3], { Plant_Rare: 1 }));

  it("avoids ingredients nobody can get, even when they are cheaper per unit", () => {
    const obtainable = (id: string) => id !== "Plant_Rare";
    expect(pickDefaultVariant([rare, normal], obtainable).key).toBe("Seeds2");
  });

  it("prefers the cheaper variant when everything is obtainable", () => {
    expect(pickDefaultVariant([normal, rare], allObtainable).key).toBe("Seeds3");
  });

  it("prefers a lower recipe book level over cost", () => {
    const locked = variant(recipe("Locked", ["X", 1], { A: 1 }, { bookLevel: 2 }));
    const open = variant(recipe("Open", ["X", 1], { A: 9 }));
    expect(pickDefaultVariant([locked, open], allObtainable).key).toBe("Open");
  });

  it("is deterministic on ties and rejects an empty list", () => {
    const a = variant(recipe("A", ["X", 1], { I: 1 }));
    const b = variant(recipe("B", ["X", 1], { J: 1 }));
    expect(pickDefaultVariant([b, a], allObtainable).key).toBe("A");
    expect(() => pickDefaultVariant([], allObtainable)).toThrow(/at least one/);
  });
});

describe("planCrafting", () => {
  // Frame = 2 Bar + 1 Wire; Wire = 1 Ore (x2 per batch); Bar = 1 Ore + 1 Wood.
  const recipes = [
    recipe("Frame1", ["Frame", 1], { Bar: 2, Wire: 1 }, { stations: ["Assembler"] }),
    recipe("Bar1", ["Bar", 1], { Ore: 1, Wood: 1 }, { timeSeconds: 60 }),
    recipe("Wire2", ["Wire", 2], { Ore: 1 }),
  ];
  const variants = buildVariantIndex(recipes);
  const plan = (itemId: string, quantity: number, choices?: Record<string, string>) =>
    planCrafting({
      itemId,
      quantity,
      variants,
      isObtainable: allObtainable,
      ...(choices && { choices }),
    });

  it("totals the raw materials of the whole tree", () => {
    const result = plan("Frame", 1);

    expect(result.materials).toEqual([
      { itemId: "Ore", amount: 3 }, // 2 for the bars + 1 for the wire batch
      { itemId: "Wood", amount: 2 },
    ]);
  });

  it("orders steps with dependencies first and the requested item last", () => {
    const ids = plan("Frame", 1).steps.map((step) => step.itemId);

    expect(ids.at(-1)).toBe("Frame");
    expect(ids.indexOf("Bar")).toBeLessThan(ids.indexOf("Frame"));
    expect(ids.indexOf("Wire")).toBeLessThan(ids.indexOf("Frame"));
  });

  it("rounds batches up and reports the leftovers", () => {
    const wire = plan("Frame", 3).steps.find((step) => step.itemId === "Wire");

    expect(wire).toMatchObject({ needed: 3, batches: 2, produced: 4 });
    expect(wire?.inputs).toEqual([{ itemId: "Ore", amount: 2 }]);
  });

  it("sums the demand from every parent BEFORE rounding", () => {
    // Both Frame and Panel need Wire (1 each). Rounding separately would craft 2 batches (4 wire);
    // together they need 2 wire = 1 batch.
    const shared = buildVariantIndex([
      recipe("Top1", ["Top", 1], { Frame: 1, Panel: 1 }),
      recipe("Frame1", ["Frame", 1], { Wire: 1 }),
      recipe("Panel1", ["Panel", 1], { Wire: 1 }),
      recipe("Wire2", ["Wire", 2], { Ore: 1 }),
    ]);
    const result = planCrafting({
      itemId: "Top",
      quantity: 1,
      variants: shared,
      isObtainable: allObtainable,
    });

    expect(result.steps.find((s) => s.itemId === "Wire")).toMatchObject({ needed: 2, batches: 1 });
    expect(result.materials).toEqual([{ itemId: "Ore", amount: 1 }]);
  });

  it("describes each step's recipe, station and batch time", () => {
    const step = plan("Frame", 1).steps.find((s) => s.itemId === "Bar");
    expect(step).toMatchObject({
      recipeId: "Bar1",
      stationIds: ["Station"],
      batchTimeSeconds: 60,
      needed: 2,
      batches: 2,
    });
  });

  it("returns just the material for an item that cannot be crafted", () => {
    expect(plan("Ore", 7)).toEqual({
      itemId: "Ore",
      quantity: 7,
      steps: [],
      materials: [{ itemId: "Ore", amount: 7 }],
    });
  });

  it("honours a chosen variant, and ignores a choice that does not exist", () => {
    const two = buildVariantIndex([
      recipe("Seeds2", ["Seeds", 2], { Plant: 1 }),
      recipe("Seeds3", ["Seeds", 3], { Plant_Rare: 1 }),
    ]);
    const make = (choices: Record<string, string>) =>
      planCrafting({
        itemId: "Seeds",
        quantity: 3,
        variants: two,
        choices,
        isObtainable: (id) => id !== "Plant_Rare",
      });

    expect(make({}).materials).toEqual([{ itemId: "Plant", amount: 2 }]);
    expect(make({ Seeds: "Seeds3" }).materials).toEqual([{ itemId: "Plant_Rare", amount: 1 }]);
    expect(make({ Seeds: "Nope" }).materials).toEqual([{ itemId: "Plant", amount: 2 }]);
  });

  it.each([0, -1, 1.5, Number.NaN, MAX_QUANTITY + 1])("rejects quantity %s", (quantity) => {
    expect(() => plan("Frame", quantity)).toThrow(RangeError);
  });

  it("accepts the largest quantity without losing precision", () => {
    const result = plan("Frame", MAX_QUANTITY);
    expect(result.materials.find((m) => m.itemId === "Wood")?.amount).toBe(MAX_QUANTITY * 2);
  });

  it("fails loudly on a recipe cycle instead of looping forever", () => {
    const cyclic = buildVariantIndex([
      recipe("A1", ["A", 1], { B: 1 }),
      recipe("B1", ["B", 1], { A: 1 }),
    ]);
    expect(() =>
      planCrafting({ itemId: "A", quantity: 1, variants: cyclic, isObtainable: allObtainable }),
    ).toThrow(/cycle: A -> B -> A/);
  });
});
