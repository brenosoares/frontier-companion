import type { Item } from "@/features/items/domain/item";
import type { Recipe } from "@/features/recipes/domain/recipe";

export interface Dataset {
  items: readonly Item[];
  recipes: readonly Recipe[];
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
export function checkIntegrity({ items, recipes }: Dataset): string[] {
  const issues: string[] = [];
  const itemIds = new Set(items.map((item) => item.id));

  for (const id of findDuplicates(items.map((item) => item.id))) {
    issues.push(`Duplicate item id "${id}"`);
  }
  for (const id of findDuplicates(recipes.map((recipe) => recipe.id))) {
    issues.push(`Duplicate recipe id "${id}"`);
  }

  for (const recipe of recipes) {
    const referenced = [recipe.output, ...recipe.inputs];
    for (const { itemId } of referenced) {
      if (!itemIds.has(itemId)) {
        issues.push(`Recipe "${recipe.id}" references unknown item "${itemId}"`);
      }
    }
  }
  return issues;
}
