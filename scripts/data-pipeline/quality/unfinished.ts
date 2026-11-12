import type { Item } from "@/features/items/domain/item";
import type { Recipe } from "@/features/recipes/domain/recipe";

/** Dev-only content in the game data is named like "Magnetic Metal Ore Wip" or "Bomb Plant [Wip]". */
const UNFINISHED_NAME = /\bwip\b/i;

export function isUnfinished(text: string): boolean {
  return UNFINISHED_NAME.test(text);
}

/**
 * Work-in-progress content is always discarded (project rule). Items named "Wip" are dropped, and
 * so are the recipes that make or consume them. Everything dropped is reported.
 */
export function dropUnfinishedItems(
  items: readonly Item[],
  recipes: readonly Recipe[],
): { items: Item[]; recipes: Recipe[]; warnings: string[] } {
  const warnings: string[] = [];
  const unfinishedIds = new Set<string>();

  const keptItems = items.filter((item) => {
    if (!isUnfinished(item.name.en)) return true;
    unfinishedIds.add(item.id);
    warnings.push(`Dropped item "${item.id}": unfinished ("Wip") content`);
    return false;
  });

  const keptRecipes = recipes.filter((recipe) => {
    const touched = [recipe.output, ...recipe.inputs].find(({ itemId }) =>
      unfinishedIds.has(itemId),
    );
    if (!touched) return true;
    warnings.push(`Dropped recipe "${recipe.id}": uses unfinished item "${touched.itemId}"`);
    return false;
  });

  return { items: keptItems, recipes: keptRecipes, warnings };
}
