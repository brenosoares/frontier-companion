import { JsonCollection, type JsonLoader } from "@/shared/data/json-collection";
import { type Recipe, RecipeSchema } from "../domain/recipe";
import type { RecipeRepository } from "../domain/recipe-repository";

export class JsonRecipeRepository implements RecipeRepository {
  private readonly recipes: JsonCollection<Recipe>;

  constructor(load: JsonLoader) {
    this.recipes = new JsonCollection(RecipeSchema, load, "recipes");
  }

  getAll(): Promise<readonly Recipe[]> {
    return this.recipes.all();
  }

  getById(id: string): Promise<Recipe | null> {
    return this.recipes.byId(id);
  }

  async findByOutput(itemId: string): Promise<readonly Recipe[]> {
    return (await this.recipes.all()).filter((recipe) => recipe.output.itemId === itemId);
  }

  async findByInput(itemId: string): Promise<readonly Recipe[]> {
    return (await this.recipes.all()).filter((recipe) =>
      recipe.inputs.some((input) => input.itemId === itemId),
    );
  }
}
