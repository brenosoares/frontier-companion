import path from "node:path";

export const GAME_VERSION = "1.0.2571";

const repoRoot = path.resolve(import.meta.dirname, "../..");

/** Raw game dump lives OUTSIDE the repository (legal gate, see PLANO.md §7). */
export const RAW_DATA_DIR = path.resolve(
  process.env.RAW_DATA_DIR ?? path.join(repoRoot, "../frontier-companion-data-raw"),
);

export const DATA_TABLES_DIR = path.join(RAW_DATA_DIR, "FarMech/Content/DataTables");
export const ICONS_DIR = path.join(RAW_DATA_DIR, "FarMech/Content/Graphics/UI/Icons");

/** Output is git-ignored until the legal gate is cleared. */
export const OUTPUT_DIR = path.join(repoRoot, "data/processed");

/** Recipe table per station. `DT_CompositeRecipes` is the union of all of them (verified). */
export const STATION_RECIPE_TABLES = [
  ["Assembler", "DT_AssemblerRecipes"],
  ["ColorMixer", "DT_ColorMixerRecipes"],
  ["ColorRefiner", "DT_ColorRefinerRecipes"],
  ["Compost", "DT_CompostRecipes"],
  ["Compost2", "DT_Compost2Recipes"],
  ["Dresser", "DT_DresserRecipes"],
  ["FoodProcessor", "DT_FoodProcessorRecipes"],
  ["FuelMaker", "DT_FuelMakerRecipes"],
  ["FuelMaker2", "DT_FuelMaker2Recipes"],
  ["FuelMaker3", "DT_FuelMaker3Recipes"],
  ["Furnace", "DT_FurnaceRecipe"],
  ["FurnaceTwo", "DT_FurnaceTwoRecipe"],
  ["Furnace3", "DT_Furnace3Recipe"],
  ["Grinder", "DT_GrinderRecipes"],
  ["Grinder2", "DT_Grinder2Recipes"],
  ["Grinder3", "DT_Grinder3Recipes"],
  ["HeavyUtilityCrafter", "DT_HeavyUtilityCrafterRecipes"],
  ["Loom", "DT_LoomRecipes"],
  ["OilPresser", "DT_OilPresserRecipes"],
  ["OilPresser2", "DT_OilPresser2Recipes"],
  ["OilPresser3", "DT_OilPresser3Recipes"],
  ["SeedMaker", "DT_SeedMakerRecipes"],
  ["SeedMaker2", "DT_SeedMaker2Recipes"],
  ["SeedMaker3", "DT_SeedMaker3Recipes"],
  ["SeedMaker4", "DT_SeedMaker4Recipes"],
  ["SeedRefinement", "DT_SeedRefinementRecipes"],
  ["SeedRefinement2", "DT_SeedRefinement2Recipes"],
  ["SeedRefinement3", "DT_SeedRefinement3Recipes"],
  ["SolarDehydrator", "DT_SolarDehydratorRecipes"],
] as const satisfies readonly (readonly [station: string, table: string])[];
