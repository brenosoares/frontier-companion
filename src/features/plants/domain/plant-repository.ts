import type { Plant, PlantEffectEntry, QualityRate } from "./plant";

export interface PlantRepository {
  getAll(): Promise<readonly Plant[]>;
  getById(id: string): Promise<Plant | null>;
  /** Items that act as fertilizer reagents, with their effect. */
  getEffects(): Promise<readonly PlantEffectEntry[]>;
  getEffectOf(itemId: string): Promise<PlantEffectEntry | null>;
  /** Harvest quality odds per quality level, lowest level first. */
  getQualityRates(): Promise<readonly QualityRate[]>;
}
