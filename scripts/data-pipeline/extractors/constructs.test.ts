// @vitest-environment node
import { describe, expect, it } from "vitest";
import { emptyText, rawText } from "../__fixtures__/tables";
import { dropUnfinishedConstructs } from "../quality/unfinished";
import { extractBlueprintPrices, extractConstructs } from "./constructs";

const GUID = "0123456789ABCDEF0123456789ABCDEF";

/** Mirrors the real export, including GUID-suffixed fields. */
function rawConstruct(name: string, overrides: Record<string, unknown> = {}) {
  return {
    [`Name_24_${GUID}`]: name,
    [`DisplayName_30_${GUID}`]: rawText(`${name} EN`, `${name} PT`),
    [`Category_61_${GUID}`]: "MainConstructCategory::NewEnumerator1",
    [`Type_41_${GUID}`]: "ConstructType::NewEnumerator9",
    [`VariantFamily_71_${GUID}`]: { TagName: "UI.ConstructVariantFamily.Chair" },
    [`FeatureFlag_68_${GUID}`]: { TagName: "None" },
    [`Icon_5_${GUID}`]: { AssetPathName: `/Game/Graphics/UI/Icons/T_${name}Icon.T_${name}Icon` },
    [`Description_9_${GUID}`]: rawText("A seat", "Um assento"),
    [`ItemCost_8_${GUID}`]: [{ Key: "Wood", Value: 4 }],
    [`Coziness_2_${GUID}`]: 3.0,
    ...overrides,
  };
}

const options = (extra: Partial<Parameters<typeof extractConstructs>[1]> = {}) => ({
  availableIcons: new Set(["ChairIcon"]),
  releasedFlags: new Set<string>(),
  blueprintPrices: new Map<string, number>(),
  ...extra,
});

describe("extractConstructs", () => {
  it("maps a raw row to a clean construct", () => {
    const [construct] = extractConstructs({ Chair: rawConstruct("Chair") }, options());

    expect(construct).toEqual({
      id: "Chair",
      name: { en: "Chair EN", "pt-BR": "Chair PT" },
      description: { en: "A seat", "pt-BR": "Um assento" },
      icon: "ChairIcon",
      category: "decorations-furniture",
      costs: [{ itemId: "Wood", amount: 4 }],
      coziness: 3,
      featureFlag: null,
      blueprintPrice: null,
    });
  });

  it("uses null for a missing icon file and an empty description", () => {
    const [construct] = extractConstructs(
      { Table: rawConstruct("Table", { [`Description_9_${GUID}`]: emptyText }) },
      options(),
    );
    expect(construct?.icon).toBeNull();
    expect(construct?.description).toBeNull();
  });

  it("attaches the merchant blueprint price when there is one", () => {
    const [construct] = extractConstructs(
      { Chair: rawConstruct("Chair") },
      options({ blueprintPrices: new Map([["Chair", 400]]) }),
    );
    expect(construct?.blueprintPrice).toBe(400);
  });

  it("keeps a flag that still gates it and drops one confirmed as released", () => {
    const flagged = rawConstruct("Chair", {
      [`FeatureFlag_68_${GUID}`]: { TagName: "Features.ModularBuilding" },
    });
    const gated = extractConstructs({ Chair: flagged }, options());
    const released = extractConstructs(
      { Chair: flagged },
      options({ releasedFlags: new Set(["ModularBuilding"]) }),
    );

    expect(gated[0]?.featureFlag).toBe("ModularBuilding");
    expect(released[0]?.featureFlag).toBeNull();
  });

  it("sorts by id and names the broken row on a malformed construct", () => {
    const sorted = extractConstructs({ B: rawConstruct("B"), A: rawConstruct("A") }, options());
    expect(sorted.map((c) => c.id)).toEqual(["A", "B"]);
    expect(() => extractConstructs({ Bad: { nope: true } }, options())).toThrow(/Construct "Bad"/);
  });

  it("fails when a construct belongs to an unclassified group", () => {
    const odd = rawConstruct("Odd", { [`Type_41_${GUID}`]: "ConstructType::NewEnumerator99" });
    expect(() => extractConstructs({ Odd: odd }, options())).toThrow(/has no category/);
  });
});

describe("extractBlueprintPrices", () => {
  const entry = (Type: string, EntryId: string, Cost: number) => ({ Type, EntryId, Cost });

  it("keeps only blueprints, with the cheapest price per construct", () => {
    const prices = extractBlueprintPrices({
      "1": entry("EMerchantEntryType::Blueprint", "Chair", 500),
      "2": entry("EMerchantEntryType::Blueprint", "Chair", 400),
      "3": entry("EMerchantEntryType::Item", "Wood", 5),
      "4": entry("EMerchantEntryType::MechPart", "Arm", 900),
    });

    expect(Object.fromEntries(prices)).toEqual({ Chair: 400 });
  });

  it("rejects malformed entries, naming them", () => {
    expect(() => extractBlueprintPrices({ "9": { Type: 1 } })).toThrow(/entry "9"/);
  });
});

describe("dropUnfinishedConstructs", () => {
  it("drops WIP constructs and says so", () => {
    const [house, chair] = extractConstructs(
      {
        House: rawConstruct("House", { [`DisplayName_30_${GUID}`]: rawText("House WIP", "Casa") }),
        Chair: rawConstruct("Chair"),
      },
      options(),
    ) as [
      ReturnType<typeof extractConstructs>[number],
      ReturnType<typeof extractConstructs>[number],
    ];

    const result = dropUnfinishedConstructs([chair, house]);
    expect(result.constructs.map((c) => c.id)).toEqual(["Chair"]);
    expect(result.warnings).toEqual(['Dropped construct "House": unfinished or obsolete content']);
  });
});
