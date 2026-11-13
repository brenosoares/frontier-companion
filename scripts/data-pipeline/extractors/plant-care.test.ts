// @vitest-environment node
import { describe, expect, it } from "vitest";
import { extractPlantEffects, extractQualityRates } from "./plant-care";

describe("extractPlantEffects", () => {
  const items = new Set(["Rabbage", "Wheat"]);

  it("maps each reagent item to its effect and potency, sorted by id", () => {
    const { effects, warnings } = extractPlantEffects(
      {
        Wheat: { Effect: "EPlantEffect::Seed", Potency: 0 },
        Rabbage: { Effect: "EPlantEffect::Growth", Potency: 800 },
      },
      items,
    );

    expect(warnings).toEqual([]);
    expect(effects).toEqual([
      { id: "Rabbage", effect: "Growth", potency: 800 },
      { id: "Wheat", effect: "Seed", potency: 0 },
    ]);
  });

  it("drops rows whose id is not an item (the spreadsheet leftover) with a warning", () => {
    const { effects, warnings } = extractPlantEffects(
      {
        "#N/A": { Effect: "EPlantEffect::Quality", Potency: 0 },
        Rabbage: { Effect: "EPlantEffect::Growth", Potency: 800 },
      },
      items,
    );
    expect(effects.map((e) => e.id)).toEqual(["Rabbage"]);
    expect(warnings).toEqual(['Dropped plant effect "#N/A": not an item']);
  });

  it("fails on an unknown effect or an unexpected shape", () => {
    expect(() =>
      extractPlantEffects({ Wheat: { Effect: "EPlantEffect::Sparkle", Potency: 1 } }, items),
    ).toThrow();
    expect(() => extractPlantEffects({ Wheat: { nope: 1 } }, items)).toThrow(/unexpected shape/);
  });
});

// The engine names fields with an index and GUID suffix, which the extractor removes.
const row = (rates: Record<string, number>) => ({
  DropRates_16_6EF724DF4D9AE228D2EFBD8F3D54E4D9: Object.entries(rates).map(([quality, Value]) => ({
    Key: `EQuality::${quality}`,
    Value,
  })),
});

describe("extractQualityRates", () => {
  it("turns each level into odds per quality, with 0 for the ones the row leaves out", () => {
    const rates = extractQualityRates({
      "1": row({ Exquisite: 5, Fine: 25, Average: 70 }),
      "-3": row({ Average: 10, Poor: 90 }),
      "0": row({ Average: 100 }),
    });

    expect(rates.map((r) => r.level)).toEqual([-3, 0, 1]);
    expect(rates[0]).toEqual({
      id: "-3",
      level: -3,
      rates: { poor: 90, average: 10, fine: 0, exquisite: 0 },
    });
    expect(rates[2]?.rates).toEqual({ poor: 0, average: 70, fine: 25, exquisite: 5 });
  });

  it("fails on an unknown quality, odds that do not add up, or an unexpected shape", () => {
    expect(() => extractQualityRates({ "1": row({ Legendary: 100 }) })).toThrow(/unknown quality/);
    expect(() => extractQualityRates({ "1": row({ Average: 60 }) })).toThrow();
    expect(() => extractQualityRates({ "1": { nope: 1 } })).toThrow(/unexpected shape/);
  });
});
