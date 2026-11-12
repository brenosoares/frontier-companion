import type { Locale } from "@/shared/domain/localized-text";
import { matchesAllWords, normalizeText } from "@/shared/lib/text";
import type { Item } from "./item";

/** Internal tags that carry no meaning for players (never shown nor offered as a filter). */
const HIDDEN_ITEM_TAGS: ReadonlySet<string> = new Set(["StaticPricing"]);

/** Tags a player should see (internal ones removed). */
export function visibleTags(tags: readonly string[]): string[] {
  return tags.filter((tag) => !HIDDEN_ITEM_TAGS.has(tag));
}

export const SORT_KEYS = ["name", "value", "weight"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/**
 * Lean, serializable view of an item for the catalog. It crosses the server -> client boundary,
 * so it carries only what the list needs, already localized.
 */
export interface ItemListEntry {
  id: string;
  name: string;
  /** Icon file name (see `Item.icon`). */
  icon: string | null;
  /** Accent-insensitive text matched by the search (both languages + id). */
  searchText: string;
  tags: string[];
  weight: number;
  sellValue: number;
  /** The game gates this item behind a feature flag; it may not be available. */
  unavailable: boolean;
}

export interface ItemFilters {
  query: string;
  tag: string | null;
  showUnavailable: boolean;
}

export function toListEntry(item: Item, locale: Locale): ItemListEntry {
  return {
    id: item.id,
    name: item.name[locale],
    icon: item.icon,
    searchText: normalizeText(`${item.name.en} ${item.name["pt-BR"]} ${item.id}`),
    tags: visibleTags(item.tags),
    weight: item.weight,
    sellValue: item.sellValue,
    unavailable: item.featureFlag !== null,
  };
}

/** Every word of the query must appear somewhere in the item's search text. */
export function filterItems(
  entries: readonly ItemListEntry[],
  { query, tag, showUnavailable }: ItemFilters,
): ItemListEntry[] {
  return entries.filter(
    (entry) =>
      (showUnavailable || !entry.unavailable) &&
      (tag === null || entry.tags.includes(tag)) &&
      matchesAllWords(entry.searchText, query),
  );
}

export function sortItems(
  entries: readonly ItemListEntry[],
  key: SortKey,
  locale: Locale,
): ItemListEntry[] {
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const byName = (a: ItemListEntry, b: ItemListEntry) => collator.compare(a.name, b.name);

  const compare: Record<SortKey, (a: ItemListEntry, b: ItemListEntry) => number> = {
    name: byName,
    value: (a, b) => b.sellValue - a.sellValue || byName(a, b),
    weight: (a, b) => b.weight - a.weight || byName(a, b),
  };
  return [...entries].sort(compare[key]);
}

/** Distinct tags among the entries that would be visible, most common first. */
export function collectTags(entries: readonly ItemListEntry[], showUnavailable: boolean): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (!showUnavailable && entry.unavailable) continue;
    for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([tagA, countA], [tagB, countB]) => countB - countA || tagA.localeCompare(tagB))
    .map(([tag]) => tag);
}
