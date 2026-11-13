import { JsonCollection, type JsonLoader } from "@/shared/data/json-collection";
import { type Plant, PlantSchema } from "../domain/plant";
import type { PlantRepository } from "../domain/plant-repository";

export class JsonPlantRepository implements PlantRepository {
  private readonly plants: JsonCollection<Plant>;

  constructor(load: JsonLoader) {
    this.plants = new JsonCollection(PlantSchema, load, "plants");
  }

  getAll(): Promise<readonly Plant[]> {
    return this.plants.all();
  }

  getById(id: string): Promise<Plant | null> {
    return this.plants.byId(id);
  }
}
