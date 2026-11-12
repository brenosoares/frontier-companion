import type { Item } from "./item";

export interface ItemRepository {
  getAll(): Promise<readonly Item[]>;
  getById(id: string): Promise<Item | null>;
}
