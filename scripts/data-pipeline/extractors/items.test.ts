// @vitest-environment node
import { describe, expect, it } from "vitest";
import { emptyText, rawItem } from "../__fixtures__/tables";
import { extractItems } from "./items";

/** Pixel-art icon set containing only `TestBarIcon` unless told otherwise. */
const extract = (rows: Record<string, unknown>, icons: string[] = ["TestBarIcon"]) =>
  extractItems(rows, new Set(icons));

describe("extractItems", () => {
  it("maps a raw row to a clean item", () => {
    const [item] = extract({
      TestBar: rawItem("TestBar", {
        Tags: ["EItemTag::Metal", "EItemTag::Bar"],
        FeatureFlag: { TagName: "Features.Trailers" },
      }),
    });

    expect(item).toEqual({
      id: "TestBar",
      name: { en: "TestBar name", "pt-BR": "TestBar nome" },
      description: { en: "TestBar desc", "pt-BR": "TestBar descrição" },
      tags: ["Metal", "Bar"],
      weight: 10,
      sellValue: 5,
      icon: "TestBarIcon",
      featureFlag: "Trailers",
      isVirtual: false,
    });
  });

  it("uses null for empty description, missing icon and missing feature flag", () => {
    const [item] = extract({
      TestOre: rawItem("TestOre", {
        Description: emptyText,
        Icon: { AssetPathName: "None", SubPathString: "" },
      }),
    });
    expect(item?.description).toBeNull();
    expect(item?.icon).toBeNull();
    expect(item?.featureFlag).toBeNull();
  });

  it("flags virtual items", () => {
    const [item] = extract({
      Node: rawItem("Node", { VirtualType: "EVirtualItemType::PowerNode" }),
    });
    expect(item?.isVirtual).toBe(true);
  });

  it("returns items sorted by id regardless of input order", () => {
    const items = extract({ B: rawItem("B"), A: rawItem("A") });
    expect(items.map((item) => item.id)).toEqual(["A", "B"]);
  });

  it("rejects a row whose EngineName differs from its key", () => {
    expect(() => extract({ A: rawItem("B") })).toThrow(/EngineName/);
  });

  it("rejects an item without a display name", () => {
    expect(() => extract({ A: rawItem("A", { DisplayName: emptyText }) })).toThrow(
      /missing display name/,
    );
  });

  it("rejects negative weights", () => {
    expect(() => extract({ A: rawItem("A", { Weight: -1 }) })).toThrow();
  });

  it("rejects a row with an unexpected shape, naming it", () => {
    expect(() => extract({ A: { EngineName: "A" } })).toThrow(/Item "A"/);
  });

  it("drops the T_ prefix of the icon and keeps it only when the file exists in the icon set", () => {
    const rows = { TestOre: rawItem("TestOre"), TestBar: rawItem("TestBar") };
    const [bar, ore] = extract(rows, ["TestOreIcon"]);

    expect(ore?.icon).toBe("TestOreIcon");
    expect(bar?.icon).toBeNull();
  });
});
