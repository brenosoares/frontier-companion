// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CONSTRUCT_CATEGORIES } from "@/features/constructs/domain/construct";
import { classifyConstruct, parseEnumeratorIndex } from "./construct-category";

const classify = (tab: number, type: number, family = "None") =>
  classifyConstruct("X", { tab, type, family });

describe("classifyConstruct", () => {
  it.each([
    [0, 0, "constructs-crafting"],
    [0, 1, "constructs-essentials"],
    [0, 5, "constructs-farm"],
    [0, 8, "constructs-storage"],
    [0, 13, "constructs-modular"],
    [1, 2, "decorations-fences"],
    [1, 4, "decorations-lights"],
    [1, 7, "decorations-ornaments"],
    [1, 9, "decorations-furniture"],
    [1, 12, "decorations-wall-mounted"],
  ])("tab %i type %i -> %s", (tab, type, expected) => {
    expect(classify(tab, type)).toBe(expected);
  });

  it("tells apart the same type code under different tabs", () => {
    expect(classify(0, 5)).toBe("constructs-farm");
    expect(classify(1, 5)).toBe("decorations-plants");
  });

  it("lets the arch family override the fence type", () => {
    expect(classify(1, 2, "Arch")).toBe("decorations-arches");
    expect(classify(1, 2, "Fence")).toBe("decorations-fences");
  });

  it("only produces categories the app knows", () => {
    for (const [tab, type] of [
      [0, 0],
      [0, 10],
      [1, 6],
      [1, 10],
      [1, 13],
    ] as const) {
      expect(CONSTRUCT_CATEGORIES).toContain(classify(tab, type));
    }
  });

  it("fails loudly on a group nobody classified, naming the construct", () => {
    expect(() => classifyConstruct("NewThing", { tab: 1, type: 99, family: "None" })).toThrow(
      /Construct "NewThing" \(tab 1, type 99, family None\) has no category/,
    );
  });
});

describe("parseEnumeratorIndex", () => {
  it("reads the number out of an unnamed enumerator", () => {
    expect(parseEnumeratorIndex("ConstructType::NewEnumerator13")).toBe(13);
    expect(parseEnumeratorIndex("MainConstructCategory::NewEnumerator0")).toBe(0);
  });

  it("rejects values that are not numbered enumerators", () => {
    expect(() => parseEnumeratorIndex("ConstructType::Walls")).toThrow(/Not a numbered/);
  });
});
