import type { Item } from "@/features/items/domain/item";
import type { Station } from "@/features/recipes/domain/station";
import type { Locale } from "@/shared/domain/localized-text";

/** Lookups a recipe view needs: item and station names and icons, in the page's language. */
export function recipeNames(items: readonly Item[], stations: readonly Station[], locale: Locale) {
  const itemNames = new Map(items.map((item) => [item.id, item.name[locale]]));
  const itemIcons = new Map(items.map((item) => [item.id, item.icon]));
  const stationNames = new Map(stations.map((station) => [station.id, station.name[locale]]));
  return {
    itemName: (itemId: string) => itemNames.get(itemId) ?? itemId,
    itemIcon: (itemId: string) => itemIcons.get(itemId) ?? null,
    stationName: (stationId: string) => stationNames.get(stationId) ?? stationId,
  };
}
