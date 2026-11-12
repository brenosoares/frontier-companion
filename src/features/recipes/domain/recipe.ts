import { z } from "zod";

const Id = z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/);
const Quantity = z.number().int().positive();

export const IngredientSchema = z.object({ itemId: Id, amount: Quantity });
export type Ingredient = z.infer<typeof IngredientSchema>;

export const RecipeSchema = z.object({
  /** Unique recipe id (DataTable row name). Not necessarily equal to the output item id. */
  id: Id,
  output: IngredientSchema,
  inputs: z.array(IngredientSchema),
  timeSeconds: z.number().nonnegative(),
  /** Required recipe-book level (0 = none). */
  bookLevel: z.number().int().nonnegative(),
  /** Stations (machines/tiers) whose recipe table lists this recipe. Empty = no station table. */
  stations: z.array(Id),
});

export type Recipe = z.infer<typeof RecipeSchema>;
