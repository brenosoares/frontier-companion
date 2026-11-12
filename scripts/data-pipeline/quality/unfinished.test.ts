// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Item } from "@/features/items/domain/item";
import type { Recipe } from "@/features/recipes/domain/recipe";
import { dropUnfinishedItems, isUnfinished } from "./unfinished";

const item = (id: string, name = id): Item => ({
  id,
  name: { en: name, "pt-BR": name },
  description: null,
  tags: [],
  weight: 1,
  sellValue: 1,
  icon: null,
  featureFlag: null,
  isVirtual: false,
});

const recipe = (id: string, output: string, inputs: string[]): Recipe => ({
  id,
  output: { itemId: output, amount: 1 },
  inputs: inputs.map((itemId) => ({ itemId, amount: 1 })),
  timeSeconds: 0,
  bookLevel: 0,
  stations: [],
});

describe("isUnfinished", () => {
  it.each([
    "Magnetic Metal Ore Wip",
    "Bomb Plant [Wip]",
    "WIP Thing",
    "wip",
    "PLACEHOLDER - Water Tower",
    "Placeholder",
    "Automator [Obsolete]",
    "obsolete",
  ])("flags %j", (text) => {
    expect(isUnfinished(text)).toBe(true);
  });

  it.each(["Swipe Tree", "Wipeout Rock", "Whipped Cream", "Green Tree", "Placeholders Inc"])(
    "accepts %j",
    (text) => {
      expect(isUnfinished(text)).toBe(false);
    },
  );
});

describe("dropUnfinishedItems", () => {
  const items = [item("Ore"), item("Ghost", "Ghost Wip"), item("Bar")];
  const recipes = [
    recipe("Bar1", "Bar", ["Ore"]),
    recipe("GhostMaker", "Ghost", ["Ore"]),
    recipe("GhostUser", "Bar", ["Ghost"]),
  ];

  it("removes unfinished items and every recipe that makes or consumes them", () => {
    const result = dropUnfinishedItems(items, recipes);

    expect(result.items.map((i) => i.id)).toEqual(["Ore", "Bar"]);
    expect(result.recipes.map((r) => r.id)).toEqual(["Bar1"]);
  });

  it("reports everything it dropped", () => {
    const { warnings } = dropUnfinishedItems(items, recipes);

    expect(warnings).toEqual([
      'Dropped item "Ghost": unfinished or obsolete content',
      'Dropped recipe "GhostMaker": uses unfinished item "Ghost"',
      'Dropped recipe "GhostUser": uses unfinished item "Ghost"',
    ]);
  });

  it("changes nothing when there is no unfinished content", () => {
    const clean = dropUnfinishedItems([item("Ore")], [recipe("R", "Ore", [])]);
    expect(clean.items).toHaveLength(1);
    expect(clean.recipes).toHaveLength(1);
    expect(clean.warnings).toEqual([]);
  });
});
