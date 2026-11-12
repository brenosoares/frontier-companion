import type { Recipe } from "./recipe";

export interface RecipeRepository {
  getAll(): Promise<readonly Recipe[]>;
  getById(id: string): Promise<Recipe | null>;
  /** Every recipe that produces the given item. */
  findByOutput(itemId: string): Promise<readonly Recipe[]>;
  /** Every recipe that consumes the given item as an ingredient. */
  findByInput(itemId: string): Promise<readonly Recipe[]>;
}
