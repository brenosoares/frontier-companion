import path from "node:path";

export const GAME_VERSION = "1.0.2571";

const repoRoot = path.resolve(import.meta.dirname, "../..");

/** Raw game dump lives OUTSIDE the repository (legal gate, see PLANO.md §7). */
export const RAW_DATA_DIR = path.resolve(
  process.env.RAW_DATA_DIR ?? path.join(repoRoot, "../frontier-companion-data-raw"),
);

export const DATA_TABLES_DIR = path.join(RAW_DATA_DIR, "FarMech/Content/DataTables");
/** Pixel-art icon set (generated outside the repo from the game icons). */
export const PIXEL_ICONS_DIR = path.join(RAW_DATA_DIR, "icons_pixel");
/** Icons used by items are copied here and served by Next at `/icons/items/<name>.png`. */
export const PUBLIC_ITEM_ICONS_DIR = path.join(repoRoot, "public/icons/items");

/** Output is git-ignored until the legal gate is cleared. */
export const OUTPUT_DIR = path.join(repoRoot, "data/processed");

export interface StationDefinition {
  /** Station id used by `recipe.stations`. */
  id: string;
  /** Recipe table listing what this station crafts. `DT_CompositeRecipes` is their union (verified). */
  table: string;
  /** `DT_Constructs` row providing the localized name, or null when the station is not a construct. */
  constructId: string | null;
  /** Used only when `constructId` is null. Our own labels, based on the game's wording. */
  fallbackName?: { en: string; "pt-BR": string };
}

const station = (
  id: string,
  table: string,
  constructId: string | null = id,
  fallbackName?: StationDefinition["fallbackName"],
): StationDefinition => ({
  id,
  table,
  constructId,
  ...(fallbackName && { fallbackName }),
});

/** Seed refinement is done by an NPC machine (Ulf's Seed Modifier), which is not a construct. */
const seedModifier = (suffix: string): StationDefinition["fallbackName"] => ({
  en: `Seed Modifier${suffix}`,
  "pt-BR": `Modificador de Sementes${suffix}`,
});

export const STATIONS: readonly StationDefinition[] = [
  station("Assembler", "DT_AssemblerRecipes"),
  station("ColorMixer", "DT_ColorMixerRecipes"),
  station("ColorRefiner", "DT_ColorRefinerRecipes"),
  station("Compost", "DT_CompostRecipes", "CompostBox"),
  station("Compost2", "DT_Compost2Recipes", "CompostBox2"),
  station("Dresser", "DT_DresserRecipes", "AnimalDresser"),
  station("FoodProcessor", "DT_FoodProcessorRecipes"),
  station("FuelMaker", "DT_FuelMakerRecipes"),
  station("FuelMaker2", "DT_FuelMaker2Recipes"),
  station("FuelMaker3", "DT_FuelMaker3Recipes"),
  station("Furnace", "DT_FurnaceRecipe"),
  station("FurnaceTwo", "DT_FurnaceTwoRecipe"),
  station("Furnace3", "DT_Furnace3Recipe"),
  station("Grinder", "DT_GrinderRecipes"),
  station("Grinder2", "DT_Grinder2Recipes"),
  station("Grinder3", "DT_Grinder3Recipes"),
  station("HeavyUtilityCrafter", "DT_HeavyUtilityCrafterRecipes"),
  station("Loom", "DT_LoomRecipes"),
  station("OilPresser", "DT_OilPresserRecipes"),
  station("OilPresser2", "DT_OilPresser2Recipes"),
  station("OilPresser3", "DT_OilPresser3Recipes"),
  station("SeedMaker", "DT_SeedMakerRecipes"),
  station("SeedMaker2", "DT_SeedMaker2Recipes", "Seedmaker2"),
  station("SeedMaker3", "DT_SeedMaker3Recipes"),
  station("SeedMaker4", "DT_SeedMaker4Recipes"),
  station("SeedRefinement", "DT_SeedRefinementRecipes", null, seedModifier("")),
  station("SeedRefinement2", "DT_SeedRefinement2Recipes", null, seedModifier(" II")),
  station("SeedRefinement3", "DT_SeedRefinement3Recipes", null, seedModifier(" III")),
  station("SolarDehydrator", "DT_SolarDehydratorRecipes"),
];
