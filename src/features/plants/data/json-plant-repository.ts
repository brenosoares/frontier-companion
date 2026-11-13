import { JsonCollection, type JsonLoader } from "@/shared/data/json-collection";
import {
  type Plant,
  type PlantEffectEntry,
  PlantEffectSchema,
  PlantSchema,
  type QualityRate,
  QualityRateSchema,
} from "../domain/plant";
import type { PlantRepository } from "../domain/plant-repository";

interface PlantLoaders {
  plants: JsonLoader;
  effects: JsonLoader;
  qualityRates: JsonLoader;
}

export class JsonPlantRepository implements PlantRepository {
  private readonly plants: JsonCollection<Plant>;
  private readonly effects: JsonCollection<PlantEffectEntry>;
  private readonly qualityRates: JsonCollection<QualityRate>;

  constructor(loaders: PlantLoaders) {
    this.plants = new JsonCollection(PlantSchema, loaders.plants, "plants");
    this.effects = new JsonCollection(PlantEffectSchema, loaders.effects, "plant-effects");
    this.qualityRates = new JsonCollection(
      QualityRateSchema,
      loaders.qualityRates,
      "quality-rates",
    );
  }

  getAll(): Promise<readonly Plant[]> {
    return this.plants.all();
  }

  getById(id: string): Promise<Plant | null> {
    return this.plants.byId(id);
  }

  getEffects(): Promise<readonly PlantEffectEntry[]> {
    return this.effects.all();
  }

  getEffectOf(itemId: string): Promise<PlantEffectEntry | null> {
    return this.effects.byId(itemId);
  }

  async getQualityRates(): Promise<readonly QualityRate[]> {
    return [...(await this.qualityRates.all())].sort((a, b) => a.level - b.level);
  }
}
