import type { Item } from "@/features/items/domain/item";
import type { ItemSource } from "@/features/items/domain/item-source";
import type { Recipe } from "@/features/recipes/domain/recipe";
import type { Station } from "@/features/recipes/domain/station";

export interface Dataset {
  items: readonly Item[];
  recipes: readonly Recipe[];
  stations: readonly Station[];
  itemSources: readonly ItemSource[];
}

function findDuplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

/** Referential integrity. Returns human-readable issues; empty means the dataset is consistent. */
export function checkIntegrity({ items, recipes, stations, itemSources }: Dataset): string[] {
  const issues: string[] = [];
  const itemIds = new Set(items.map((item) => item.id));
  const stationIds = new Set(stations.map((station) => station.id));

  for (const id of findDuplicates(items.map((item) => item.id))) {
    issues.push(`Duplicate item id "${id}"`);
  }
  for (const id of findDuplicates(recipes.map((recipe) => recipe.id))) {
    issues.push(`Duplicate recipe id "${id}"`);
  }
  for (const id of findDuplicates(stations.map((station) => station.id))) {
    issues.push(`Duplicate station id "${id}"`);
  }

  for (const id of findDuplicates(itemSources.map((source) => source.id))) {
    issues.push(`Duplicate item source id "${id}"`);
  }
  for (const source of itemSources) {
    if (!itemIds.has(source.itemId)) {
      issues.push(`Item source "${source.id}" references unknown item "${source.itemId}"`);
    }
  }

  for (const recipe of recipes) {
    const referenced = [recipe.output, ...recipe.inputs];
    for (const { itemId } of referenced) {
      if (!itemIds.has(itemId)) {
        issues.push(`Recipe "${recipe.id}" references unknown item "${itemId}"`);
      }
    }
    for (const stationId of recipe.stations) {
      if (!stationIds.has(stationId)) {
        issues.push(`Recipe "${recipe.id}" references unknown station "${stationId}"`);
      }
    }
  }
  return issues;
}
