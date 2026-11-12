// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  assetStem,
  normalizeKeys,
  parseDataTableRows,
  parseEnumValue,
  parseFeatureFlag,
  stripGuidSuffix,
} from "./normalize";

const GUID = "23C41772494BABD21F26659B76689BCD";

describe("stripGuidSuffix", () => {
  it("removes the index + GUID suffix", () => {
    expect(stripGuidSuffix(`Time_15_${GUID}`)).toBe("Time");
    expect(stripGuidSuffix(`BookLevelRequirement_18_${GUID}`)).toBe("BookLevelRequirement");
  });

  it("keeps keys without a GUID suffix", () => {
    expect(stripGuidSuffix("EngineName")).toBe("EngineName");
    expect(stripGuidSuffix("Some_Key_1")).toBe("Some_Key_1");
  });
});

describe("normalizeKeys", () => {
  it("renames keys recursively, including inside arrays", () => {
    const input = { [`Input_35_${GUID}`]: [{ [`Key_1_${GUID}`]: "Ore" }] };
    expect(normalizeKeys(input)).toEqual({ Input: [{ Key: "Ore" }] });
  });

  it("throws when two keys collapse into the same name", () => {
    const input = { [`Time_1_${GUID}`]: 1, Time: 2 };
    expect(() => normalizeKeys(input)).toThrow(/collision/i);
  });

  it("leaves primitives untouched", () => {
    expect(normalizeKeys(5)).toBe(5);
    expect(normalizeKeys(null)).toBeNull();
  });
});

describe("parseEnumValue", () => {
  it.each([
    ["EItemTag::Oil", "Oil"],
    ["ConstructType::NewEnumerator0", "NewEnumerator0"],
    ["Plain", "Plain"],
  ])("%s -> %s", (raw, expected) => {
    expect(parseEnumValue(raw)).toBe(expected);
  });
});

describe("assetStem", () => {
  it("extracts the file stem from an asset path", () => {
    expect(assetStem("/Game/Graphics/UI/Icons/T_X.T_X")).toBe("T_X");
  });

  it.each(["None", ""])("returns null for %j", (raw) => {
    expect(assetStem(raw)).toBeNull();
  });
});

describe("parseFeatureFlag", () => {
  it("strips the Features. prefix and maps None to null", () => {
    expect(parseFeatureFlag("Features.RanchAnimals")).toBe("RanchAnimals");
    expect(parseFeatureFlag("None")).toBeNull();
  });
});

describe("parseDataTableRows", () => {
  it("returns Rows from the export shape", () => {
    expect(parseDataTableRows([{ Rows: { A: 1 } }], "DT_X")).toEqual({ A: 1 });
  });

  it("throws a named error for an unexpected shape", () => {
    expect(() => parseDataTableRows({ nope: true }, "DT_X")).toThrow(/DT_X: not a DataTable/);
  });
});
