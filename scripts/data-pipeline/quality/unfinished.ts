import type { Construct } from "@/features/constructs/domain/construct";
import type { Item } from "@/features/items/domain/item";
import type { Recipe } from "@/features/recipes/domain/recipe";

/**
 * Content that must never reach players: work in progress ("Magnetic Metal Ore Wip",
 * "Bomb Plant [Wip]"), placeholders ("PLACEHOLDER - Water Tower") and content the game itself
 * retired ("Automator [Obsolete]"). Whole words only, so "Swipe" or "Wipeout" are fine.
 */
const UNFINISHED_NAME = /\b(?:wip|placeholder|obsolete)\b/i;

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
    warnings.push(`Dropped item "${item.id}": unfinished or obsolete content`);
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

/** Constructs named "… WIP" (e.g. unfinished houses and launch pads) are dropped and reported. */
export function dropUnfinishedConstructs(constructs: readonly Construct[]): {
  constructs: Construct[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const kept = constructs.filter((construct) => {
    if (!isUnfinished(construct.name.en)) return true;
    warnings.push(`Dropped construct "${construct.id}": unfinished or obsolete content`);
    return false;
  });
  return { constructs: kept, warnings };
}
