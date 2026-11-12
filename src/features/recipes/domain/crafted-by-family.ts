import { buildVariantIndex, pickDefaultVariant } from "./crafting-plan";
import type { Recipe } from "./recipe";
import type { Station } from "./station";

/** One craftable item as listed under a machine family. */
export interface CraftedEntry {
  itemId: string;
  /** Ingredients of the default recipe variant (its smallest batch). */
  costs: { itemId: string; amount: number }[];
  /** Units that smallest batch yields. */
  yields: number;
  /** Stations of this family that craft it (all tiers), in the order of `stations`. */
  stationIds: string[];
}

/**
 * Groups what can be crafted by machine family (Furnace, Grinder…). An item made at several tiers
 * is listed once per family; the same item made in two families is listed in both.
 */
export function groupCraftedByFamily(
  recipes: readonly Recipe[],
  stations: readonly Station[],
  isObtainable: (itemId: string) => boolean,
): Map<string, CraftedEntry[]> {
  const familyOf = new Map(stations.map((station) => [station.id, station.family]));
  const stationOrder = new Map(stations.map((station, index) => [station.id, index]));

  // family -> output item -> recipes
  const grouped = new Map<string, Map<string, Recipe[]>>();
  for (const recipe of recipes) {
    for (const family of new Set(recipe.stations.map((id) => familyOf.get(id)))) {
      if (family === undefined) continue;
      const byItem = grouped.get(family) ?? new Map<string, Recipe[]>();
      byItem.set(recipe.output.itemId, [...(byItem.get(recipe.output.itemId) ?? []), recipe]);
      grouped.set(family, byItem);
    }
  }

  return new Map(
    [...grouped].map(([family, byItem]) => [
      family,
      [...byItem].map(([itemId, itemRecipes]): CraftedEntry => {
        const variants = buildVariantIndex(itemRecipes).get(itemId) ?? [];
        const { recipe } = pickDefaultVariant(variants, isObtainable);
        const familyStations = new Set(
          itemRecipes.flatMap((r) => r.stations).filter((id) => familyOf.get(id) === family),
        );
        return {
          itemId,
          costs: recipe.inputs.map(({ itemId: inputId, amount }) => ({ itemId: inputId, amount })),
          yields: recipe.output.amount,
          stationIds: [...familyStations].sort(
            (a, b) => (stationOrder.get(a) ?? 0) - (stationOrder.get(b) ?? 0),
          ),
        };
      }),
    ]),
  );
}
