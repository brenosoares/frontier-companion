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
  price: null,
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

  it("lists the ids of items that have at least one source", async () => {
    const repository = new JsonItemSourceRepository(async () => data);
    expect(await repository.getSourcedItemIds()).toEqual(new Set(["Stone", "Wood"]));
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

  it("lists unknown chances last, then by name", async () => {
    const unknown = {
      ...source("Merchant", "Stone", 1),
      chance: null,
      price: 40,
      kind: "merchant" as const,
      sourceName: null,
    };
    const repository = new JsonItemSourceRepository(async () => [
      unknown,
      source("Rock", "Stone", 50),
    ]);

    const found = await repository.findByItem("Stone");
    expect(found.map((s) => s.sourceId)).toEqual(["Rock", "Merchant"]);
  });

  it("refuses amounts that are only half given", async () => {
    const half = [{ ...source("A", "X", 50), maxAmount: null }];
    await expect(new JsonItemSourceRepository(async () => half).findByItem("X")).rejects.toThrow(
      /Invalid item sources data/,
    );
  });

  it("accepts a source that gives no amount, chance or name (a merchant)", async () => {
    const merchant = [
      {
        ...source("Bundle", "Seeds", 1),
        kind: "merchant",
        sourceName: null,
        minAmount: null,
        maxAmount: null,
        chance: null,
        price: 20,
      },
    ];
    expect(
      await new JsonItemSourceRepository(async () => merchant).findByItem("Seeds"),
    ).toHaveLength(1);
  });

  it("can ignore some kinds of source when listing sourced items", async () => {
    const mutation = { ...source("Seeds", "Wheat_Rare", 1), kind: "mutation" as const };
    const repository = new JsonItemSourceRepository(async () => [
      mutation,
      source("Rock", "Stone", 50),
    ]);

    expect(await repository.getSourcedItemIds()).toEqual(new Set(["Wheat_Rare", "Stone"]));
    expect(await repository.getSourcedItemIds(["mutation"])).toEqual(new Set(["Stone"]));
  });
});
