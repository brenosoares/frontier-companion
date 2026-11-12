import type { Station } from "./station";

export interface StationRepository {
  getAll(): Promise<readonly Station[]>;
  getById(id: string): Promise<Station | null>;
}
