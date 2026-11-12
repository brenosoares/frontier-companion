import { describe, expect, it } from "vitest";
import type { Item } from "./item";
import {
  collectTags,
  filterItems,
  type ItemListEntry,
  normalizeText,
  sortItems,
  toListEntry,
} from "./item-list";

const item = (id: string, overrides: Partial<Item> = {}): Item => ({
  id,
  name: { en: `${id} EN`, "pt-BR": `${id} PT` },
  description: null,
  tags: [],
  weight: 1,
  sellValue: 1,
  icon: null,
  featureFlag: null,
  isVirtual: false,
  ...overrides,
});

const entry = (id: string, overrides: Partial<ItemListEntry> = {}): ItemListEntry => ({
  id,
  name: id,
  icon: null,
  searchText: normalizeText(id),
  tags: [],
  weight: 1,
  sellValue: 1,
  unavailable: false,
  ...overrides,
});

const NO_FILTERS = { query: "", tag: null, showUnavailable: false };

describe("normalizeText", () => {
  it("removes accents, case and surrounding spaces", () => {
    expect(normalizeText("  Óleo de Rubimora ")).toBe("oleo de rubimora");
    expect(normalizeText("Minério")).toBe("minerio");
  });
});

describe("toListEntry", () => {
  it("localizes the name but searches in both languages and by id", () => {
    const result = toListEntry(item("Wheat", { name: { en: "Wheat", "pt-BR": "Trigo" } }), "pt-BR");

    expect(result.name).toBe("Trigo");
    expect(result.searchText).toContain("wheat");
    expect(result.searchText).toContain("trigo");
  });

  it("carries the icon through", () => {
    expect(toListEntry(item("X", { icon: "XIcon" }), "en").icon).toBe("XIcon");
  });

  it("drops internal tags", () => {
    const result = toListEntry(item("X", { tags: ["Metal", "StaticPricing"] }), "en");
    expect(result.tags).toEqual(["Metal"]);
  });

  it("marks feature-flagged items as unavailable", () => {
    expect(toListEntry(item("X", { featureFlag: "Trailers" }), "en").unavailable).toBe(true);
    expect(toListEntry(item("X"), "en").unavailable).toBe(false);
  });
});

describe("filterItems", () => {
  const entries = [
    entry("Rabberry Oil", { tags: ["Oil"] }),
    entry("Copper Ore", { tags: ["Metal"] }),
    entry("Secret", { tags: ["Metal"], unavailable: true }),
  ];

  it("hides unavailable items by default and shows them on request", () => {
    expect(filterItems(entries, NO_FILTERS).map((e) => e.id)).toEqual([
      "Rabberry Oil",
      "Copper Ore",
    ]);
    expect(filterItems(entries, { ...NO_FILTERS, showUnavailable: true })).toHaveLength(3);
  });

  it("filters by tag", () => {
    expect(filterItems(entries, { ...NO_FILTERS, tag: "Metal" }).map((e) => e.id)).toEqual([
      "Copper Ore",
    ]);
  });

  it("matches every word, ignoring accents and order", () => {
    expect(filterItems(entries, { ...NO_FILTERS, query: "oil rabberry" })).toHaveLength(1);
    expect(filterItems(entries, { ...NO_FILTERS, query: "RÁBBERRY" })).toHaveLength(1);
    expect(filterItems(entries, { ...NO_FILTERS, query: "rabberry ore" })).toHaveLength(0);
  });

  it("combines query, tag and availability", () => {
    const result = filterItems(entries, {
      query: "secret",
      tag: "Metal",
      showUnavailable: true,
    });
    expect(result.map((e) => e.id)).toEqual(["Secret"]);
  });

  it("ignores a blank query", () => {
    expect(filterItems(entries, { ...NO_FILTERS, query: "   " })).toHaveLength(2);
  });
});

describe("sortItems", () => {
  const entries = [
    entry("banana", { name: "Banana", sellValue: 5, weight: 9 }),
    entry("apple", { name: "Árvore", sellValue: 20, weight: 3 }),
    entry("cherry", { name: "Cereja", sellValue: 20, weight: 3 }),
  ];

  it("sorts by name using locale rules (accents do not break order)", () => {
    expect(sortItems(entries, "name", "pt-BR").map((e) => e.name)).toEqual([
      "Árvore",
      "Banana",
      "Cereja",
    ]);
  });

  it("sorts by value descending with a stable name tiebreak", () => {
    expect(sortItems(entries, "value", "pt-BR").map((e) => e.id)).toEqual([
      "apple",
      "cherry",
      "banana",
    ]);
  });

  it("sorts by weight descending", () => {
    expect(sortItems(entries, "weight", "en")[0]?.id).toBe("banana");
  });

  it("does not mutate its input", () => {
    const copy = [...entries];
    sortItems(entries, "value", "en");
    expect(entries).toEqual(copy);
  });
});

describe("collectTags", () => {
  const entries = [
    entry("a", { tags: ["Metal", "Bar"] }),
    entry("b", { tags: ["Metal"] }),
    entry("c", { tags: ["Secret"], unavailable: true }),
  ];

  it("orders by popularity then name and skips unavailable items by default", () => {
    expect(collectTags(entries, false)).toEqual(["Metal", "Bar"]);
  });

  it("includes tags of unavailable items when they are shown", () => {
    expect(collectTags(entries, true)).toEqual(["Metal", "Bar", "Secret"]);
  });
});
