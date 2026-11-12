import type { Construct, ConstructCategory } from "./construct";

export interface ConstructRepository {
  getAll(): Promise<readonly Construct[]>;
  getById(id: string): Promise<Construct | null>;
  findByCategory(category: ConstructCategory): Promise<readonly Construct[]>;
}
