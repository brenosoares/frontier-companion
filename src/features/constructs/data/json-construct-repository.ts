import { JsonCollection, type JsonLoader } from "@/shared/data/json-collection";
import { type Construct, type ConstructCategory, ConstructSchema } from "../domain/construct";
import type { ConstructRepository } from "../domain/construct-repository";

export class JsonConstructRepository implements ConstructRepository {
  private readonly constructs: JsonCollection<Construct>;

  constructor(load: JsonLoader) {
    this.constructs = new JsonCollection(ConstructSchema, load, "constructs");
  }

  getAll(): Promise<readonly Construct[]> {
    return this.constructs.all();
  }

  getById(id: string): Promise<Construct | null> {
    return this.constructs.byId(id);
  }

  async findByCategory(category: ConstructCategory): Promise<readonly Construct[]> {
    return (await this.constructs.all()).filter((construct) => construct.category === category);
  }
}
