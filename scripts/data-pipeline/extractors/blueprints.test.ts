// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  blueprintDefaults,
  critterFeedSources,
  extractHazardSources,
  extractIncubator,
  extractLargeItemSources,
  extractLootGoblinSources,
  extractWildFeeding,
} from "./blueprints";

const names = new Map([
  ["AluminiumChunk", { en: "Aluminum Chunk", "pt-BR": "Pedaço de Alumínio" }],
]);

describe("blueprintDefaults", () => {
  it("returns the properties of the Default__ object", () => {
    const json = [
      { Name: "Other", Properties: { a: 1 } },
      { Name: "Default__BP_X_C", Properties: { b: 2 } },
    ];
    expect(blueprintDefaults(json, "x")).toEqual({ b: 2 });
  });

  it("fails naming the file when there is no Default__ object or the shape is wrong", () => {
    expect(() => blueprintDefaults([{ Name: "Other", Properties: {} }], "f.json")).toThrow(
      /f.json/,
    );
    expect(() => blueprintDefaults({}, "g.json")).toThrow(/g.json/);
  });
});

describe("extractLargeItemSources", () => {
  it("lists what a large item that is itself an item breaks into", () => {
    const sources = extractLargeItemSources(
      [
        {
          label: "a",
          defaults: {
            EngineName: "AluminiumChunk",
            ItemDrops: [{ ItemName: "AluminiumRod", Count: 4 }],
          },
        },
        {
          label: "b",
          defaults: { EngineName: "Unknown", ItemDrops: [{ ItemName: "Rock", Count: 1 }] },
        },
        { label: "c", defaults: {} },
      ],
      names,
    );
    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      kind: "large-item",
      sourceId: "AluminiumChunk",
      itemId: "AluminiumRod",
      minAmount: 4,
      maxAmount: 4,
      chance: 100,
    });
  });
});

describe("extractHazardSources", () => {
  it("turns the count weights into a chance and an amount range, ignoring zero drops", () => {
    const [source] = extractHazardSources({
      ItemDrops: [
        {
          ItemName: "NoxiousPod",
          Counts: [
            { Key: "0", Value: 50 },
            { Key: "1", Value: 30 },
            { Key: "2", Value: 20 },
          ],
        },
        { ItemName: "Never", Counts: [{ Key: "0", Value: 1 }] },
      ],
    });
    expect(source).toMatchObject({ itemId: "NoxiousPod", minAmount: 1, maxAmount: 2, chance: 50 });
  });
});

describe("extractLootGoblinSources", () => {
  it("lists items of the pools the drop table uses, without amount or chance", () => {
    const sources = extractLootGoblinSources({
      ItemPools: [
        { Key: "Used", Value: { Items: [{ ItemName: "Clam" }, { ItemName: "Clam" }] } },
        { Key: "Unused", Value: { Items: [{ ItemName: "Hidden" }] } },
      ],
      DropTable: [{ PoolName: "Used" }],
    });
    expect(sources.map((s) => [s.itemId, s.chance, s.minAmount])).toEqual([["Clam", null, null]]);
  });
});

describe("wild feeding", () => {
  const feeding = extractWildFeeding(
    { FeedResourceItem: "Feather", FeedEggItem: "TookanEgg", FeedEggChance: 0.05 },
    { FeedDropChance: 1 },
    "Tookan",
  );

  it("reads the resource, the egg and the chances as percentages", () => {
    expect(feeding).toEqual({
      resourceItemId: "Feather",
      eggItemId: "TookanEgg",
      eggChance: 5,
      resourceChance: 100,
    });
  });

  it("yields a resource and an egg source named after the critter", () => {
    const sources = critterFeedSources("Tookan", { en: "Tookan", "pt-BR": "Tookan" }, feeding);
    expect(sources.map((s) => [s.kind, s.itemId, s.chance])).toEqual([
      ["critter-feed", "Feather", 100],
      ["critter-feed", "TookanEgg", 5],
    ]);
  });

  it("fails on an unexpected shape", () => {
    expect(() => extractWildFeeding({}, { FeedDropChance: 1 }, "X")).toThrow(/Critter "X"/);
  });
});

describe("extractIncubator", () => {
  it("reads lens chances and maps each egg to its animal", () => {
    const { incubator, eggToAnimal } = extractIncubator({
      ChanceToSpawnSmall: 0.25,
      ChanceToSpawnLarge: 0.25,
      ChanceToSpawnDouble: 0.1,
      ChanceToSpawnRare: 0.1,
      RareEggIncubationTime: 5,
      EggToAnimal: [
        { Key: "/Game/Blueprints/BP_TookanEggPickup.BP_TookanEggPickup_C", Value: "Tookan" },
      ],
    });
    expect(incubator).toEqual({
      lensChances: { smaller: 25, larger: 25, double: 10, rare: 10 },
      rareEggIncubationDays: 5,
    });
    expect(eggToAnimal.get("TookanEgg")).toBe("Tookan");
  });
});
