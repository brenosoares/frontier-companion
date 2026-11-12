import { describe, expect, it } from "vitest";
import { MAX_QUANTITY } from "./crafting-plan";
import {
  DEFAULT_CALCULATOR_STATE,
  parseCalculatorState,
  parseQuantity,
  serializeCalculatorState,
} from "./calculator-state";

const parse = (query: string) => parseCalculatorState(new URLSearchParams(query));

describe("parseQuantity", () => {
  it.each([
    ["5", 5],
    [" 12 ", 12],
    ["99999", MAX_QUANTITY],
  ])("accepts %j", (raw, expected) => {
    expect(parseQuantity(raw)).toBe(expected);
  });

  it.each([null, undefined, "", "0", "-3", "2.5", "abc", "1e3", "0x10", "٣"])(
    "falls back to 1 for %j",
    (raw) => {
      expect(parseQuantity(raw)).toBe(1);
    },
  );

  it("caps absurd quantities instead of rejecting them", () => {
    expect(parseQuantity("100000")).toBe(MAX_QUANTITY);
    expect(parseQuantity("9".repeat(30))).toBe(MAX_QUANTITY);
  });
});

describe("parseCalculatorState", () => {
  it("returns defaults for an empty URL", () => {
    expect(parse("")).toEqual(DEFAULT_CALCULATOR_STATE);
  });

  it("reads item, quantity and variant choices", () => {
    expect(parse("item=WheatSeeds&qty=7&v=WheatSeeds:WheatSeeds3&v=Bar:Bar1")).toEqual({
      itemId: "WheatSeeds",
      quantity: 7,
      choices: { WheatSeeds: "WheatSeeds3", Bar: "Bar1" },
    });
  });

  it("ignores malformed ids and choices", () => {
    const state = parse("item=../etc&v=nocolon&v=A:B:C&v=:x&v=a-b:c");
    expect(state.itemId).toBeNull();
    expect(state.choices).toEqual({});
  });
});

describe("serializeCalculatorState", () => {
  it("omits default values", () => {
    expect(serializeCalculatorState(DEFAULT_CALCULATOR_STATE)).toBe("");
  });

  it("round-trips a customized state with stable ordering", () => {
    const state = { itemId: "Seeds", quantity: 40, choices: { Zed: "Zed1", Alpha: "Alpha2" } };
    const query = serializeCalculatorState(state);

    expect(query).toBe("item=Seeds&qty=40&v=Alpha%3AAlpha2&v=Zed%3AZed1");
    expect(parse(query)).toEqual(state);
  });
});
