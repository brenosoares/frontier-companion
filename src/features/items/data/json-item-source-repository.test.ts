import { describe, expect, it } from "vitest";
import type { ItemSource } from "../domain/item-source";
import { JsonItemSourceRepository } from "./json-item-source-repository";

const source = (sourceId: string, itemId: string, chance: number): ItemSource => ({
  id: `node:${sourceId}:${itemId}`,
  itemId,
  kind: "node",
  sourceId,
  sourceName: { en: sourceId, "pt-BR": sourceId },
  minAmount: 1,
  maxAmount: 3,
  chance,
});

describe("JsonItemSourceRepository", () => {
  const data = [
    source("Rock", "Stone", 50),
    source("Tree", "Wood", 100),
    source("Cliff", "Stone", 90),
  ];

  it("returns only the sources of the item, most likely first", async () => {
    const repository = new JsonItemSourceRepository(async () => data);
    const found = await repository.findByItem("Stone");
    expect(found.map((s) => s.sourceId)).toEqual(["Cliff", "Rock"]);
  });

  it("returns nothing for an item without sources", async () => {
    const repository = new JsonItemSourceRepository(async () => data);
    expect(await repository.findByItem("Nope")).toEqual([]);
  });

  it("refuses malformed data (chance out of range, inverted amounts)", async () => {
    const bad = [{ ...source("A", "X", 50), chance: 150 }];
    await expect(new JsonItemSourceRepository(async () => bad).findByItem("X")).rejects.toThrow(
      /Invalid item sources data/,
    );

    const inverted = [{ ...source("A", "X", 50), minAmount: 5, maxAmount: 2 }];
    await expect(
      new JsonItemSourceRepository(async () => inverted).findByItem("X"),
    ).rejects.toThrow(/Invalid item sources data/);
  });
});
