import { JsonCollection, type JsonLoader } from "@/shared/data/json-collection";
import { type Animal, AnimalSchema } from "../domain/animal";
import type { AnimalRepository } from "../domain/animal-repository";

export class JsonAnimalRepository implements AnimalRepository {
  private readonly animals: JsonCollection<Animal>;

  constructor(load: JsonLoader) {
    this.animals = new JsonCollection(AnimalSchema, load, "animals");
  }

  getAll(): Promise<readonly Animal[]> {
    return this.animals.all();
  }

  getById(id: string): Promise<Animal | null> {
    return this.animals.byId(id);
  }
}
