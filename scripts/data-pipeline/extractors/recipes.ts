import { z } from "zod";
import { type Recipe, RecipeSchema } from "@/features/recipes/domain/recipe";
import { normalizeKeys } from "../unreal/normalize";

/** Shape of a recipe row AFTER `normalizeKeys` (GUID suffixes stripped). */
const RawRecipeSchema = z.object({
  Output: z.object({ Name: z.string(), Amount: z.number() }),
  BookLevelRequirement: z.number(),
  Time: z.number(),
  Input: z.array(z.object({ Key: z.string(), Value: z.number() })),
});

type RawRecipe = z.infer<typeof RawRecipeSchema>;

function parseRecipeRow(id: string, row: unknown): RawRecipe {
  const parsed = RawRecipeSchema.safeParse(normalizeKeys(row));
  if (!parsed.success) {
    throw new Error(`Recipe "${id}" has an unexpected shape\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

/** recipe id -> stations whose table lists it. Throws if a station lists an unknown recipe. */
function indexStations(
  recipeIds: ReadonlySet<string>,
  stationRows: Readonly<Record<string, Record<string, unknown>>>,
): Map<string, string[]> {
  const stationsByRecipe = new Map<string, string[]>();
  for (const [station, rows] of Object.entries(stationRows)) {
    for (const recipeId of Object.keys(rows)) {
      if (!recipeIds.has(recipeId)) {
        throw new Error(`Station "${station}" lists unknown recipe "${recipeId}"`);
      }
      stationsByRecipe.set(recipeId, [...(stationsByRecipe.get(recipeId) ?? []), station]);
    }
  }
  return stationsByRecipe;
}

/**
 * @param compositeRows `DT_CompositeRecipes` rows (single source of truth for recipe data)
 * @param stationRows per-station recipe tables, used only to know where each recipe is crafted
 */
export function extractRecipes(
  compositeRows: Record<string, unknown>,
  stationRows: Readonly<Record<string, Record<string, unknown>>>,
): Recipe[] {
  const stationsByRecipe = indexStations(new Set(Object.keys(compositeRows)), stationRows);

  return Object.entries(compositeRows)
    .map(([id, row]) => {
      const raw = parseRecipeRow(id, row);
      return RecipeSchema.parse({
        id,
        output: { itemId: raw.Output.Name, amount: raw.Output.Amount },
        inputs: raw.Input.map((input) => ({ itemId: input.Key, amount: input.Value })),
        timeSeconds: raw.Time,
        bookLevel: raw.BookLevelRequirement,
        stations: (stationsByRecipe.get(id) ?? []).sort(),
      });
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}
