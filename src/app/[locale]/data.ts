/**
 * Composition root for game data: the only place that knows the JSON files exist.
 * Features depend on repository interfaces; swapping the source (API, DB) happens here.
 *
 * The files are bundled at build time (no runtime I/O), which suits static rendering with
 * `cacheComponents`. They are still validated by Zod when first read.
 */
import itemSourcesJson from "@data/processed/item-sources.json";
import itemsJson from "@data/processed/items.json";
import recipesJson from "@data/processed/recipes.json";
import stationsJson from "@data/processed/stations.json";
import { JsonItemRepository } from "@/features/items/data/json-item-repository";
import { JsonItemSourceRepository } from "@/features/items/data/json-item-source-repository";
import type { ItemRepository } from "@/features/items/domain/item-repository";
import type { ItemSourceRepository } from "@/features/items/domain/item-source-repository";
import { JsonRecipeRepository } from "@/features/recipes/data/json-recipe-repository";
import { JsonStationRepository } from "@/features/recipes/data/json-station-repository";
import type { RecipeRepository } from "@/features/recipes/domain/recipe-repository";
import type { StationRepository } from "@/features/recipes/domain/station-repository";

export const itemRepository: ItemRepository = new JsonItemRepository(async () => itemsJson);
export const recipeRepository: RecipeRepository = new JsonRecipeRepository(async () => recipesJson);
export const stationRepository: StationRepository = new JsonStationRepository(
  async () => stationsJson,
);
export const itemSourceRepository: ItemSourceRepository = new JsonItemSourceRepository(
  async () => itemSourcesJson,
);
