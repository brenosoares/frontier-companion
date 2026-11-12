import { JsonCollection, type JsonLoader } from "@/shared/data/json-collection";
import { type Item, ItemSchema } from "../domain/item";
import type { ItemRepository } from "../domain/item-repository";

export class JsonItemRepository implements ItemRepository {
  private readonly items: JsonCollection<Item>;

  constructor(load: JsonLoader) {
    this.items = new JsonCollection(ItemSchema, load, "items");
  }

  getAll(): Promise<readonly Item[]> {
    return this.items.all();
  }

  getById(id: string): Promise<Item | null> {
    return this.items.byId(id);
  }
}
