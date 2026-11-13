import type { Plant } from "./plant";

export interface PlantRepository {
  getAll(): Promise<readonly Plant[]>;
  getById(id: string): Promise<Plant | null>;
}
