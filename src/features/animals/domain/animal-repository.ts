import type { Animal } from "./animal";

export interface AnimalRepository {
  getAll(): Promise<readonly Animal[]>;
  getById(id: string): Promise<Animal | null>;
}
