/**
 * Composition root for game data: the only place that knows the JSON files exist.
 * Features depend on repository interfaces; swapping the source (API, DB) happens here.
 *
 * The files are bundled at build time (no runtime I/O), which suits static rendering with
 * `cacheComponents`. They are still validated by Zod when first read.
 */
import animalsJson from "@data/processed/animals.json";
import plantsJson from "@data/processed/plants.json";
import mechChipsJson from "@data/processed/mech-chips.json";
import mechPartsJson from "@data/processed/mech-parts.json";
import mechStatsJson from "@data/processed/mech-stats.json";
import incubatorJson from "@data/processed/incubator.json";
import constructsJson from "@data/processed/constructs.json";
import itemSourcesJson from "@data/processed/item-sources.json";
import itemsJson from "@data/processed/items.json";
import recipesJson from "@data/processed/recipes.json";
import stationsJson from "@data/processed/stations.json";
import { IncubatorSchema } from "@/features/animals/domain/animal";
import { JsonPlantRepository } from "@/features/plants/data/json-plant-repository";
import type { PlantRepository } from "@/features/plants/domain/plant-repository";
import { JsonMechRepository } from "@/features/mech/data/json-mech-repository";
import type { MechRepository } from "@/features/mech/domain/mech-repository";
import { JsonAnimalRepository } from "@/features/animals/data/json-animal-repository";
import type { AnimalRepository } from "@/features/animals/domain/animal-repository";
import { JsonConstructRepository } from "@/features/constructs/data/json-construct-repository";
import type { ConstructRepository } from "@/features/constructs/domain/construct-repository";
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
export const constructRepository: ConstructRepository = new JsonConstructRepository(
  async () => constructsJson,
);
/** Egg Incubator defaults: one record, so no repository. */
export const incubator = IncubatorSchema.parse(incubatorJson);

export const animalRepository: AnimalRepository = new JsonAnimalRepository(async () => animalsJson);

export const mechRepository: MechRepository = new JsonMechRepository({
  stats: async () => mechStatsJson,
  parts: async () => mechPartsJson,
  chips: async () => mechChipsJson,
});

export const plantRepository: PlantRepository = new JsonPlantRepository(async () => plantsJson);
