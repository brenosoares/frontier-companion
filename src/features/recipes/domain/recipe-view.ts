import type { Recipe } from "./recipe";

export interface RecipeLine {
  itemId: string;
  /** Localized item name. */
  name: string;
  /** Icon file name (see `Item.icon`). */
  icon: string | null;
  amount: number;
}

/** Display-ready recipe: ids already resolved to localized names. */
export interface RecipeView {
  id: string;
  output: RecipeLine;
  inputs: RecipeLine[];
  timeSeconds: number;
  bookLevel: number;
  /** Localized station names. */
  stations: string[];
}

/** Resolves ids to names. Injected so the mapping stays pure and locale-agnostic. */
export interface RecipeNameResolver {
  itemName(itemId: string): string;
  itemIcon(itemId: string): string | null;
  stationName(stationId: string): string;
}

export function toRecipeView(recipe: Recipe, names: RecipeNameResolver): RecipeView {
  const line = ({ itemId, amount }: { itemId: string; amount: number }): RecipeLine => ({
    itemId,
    amount,
    name: names.itemName(itemId),
    icon: names.itemIcon(itemId),
  });

  return {
    id: recipe.id,
    output: line(recipe.output),
    inputs: recipe.inputs.map(line),
    timeSeconds: recipe.timeSeconds,
    bookLevel: recipe.bookLevel,
    stations: recipe.stations.map((stationId) => names.stationName(stationId)),
  };
}
