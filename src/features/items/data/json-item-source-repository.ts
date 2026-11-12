import { JsonCollection, type JsonLoader } from "@/shared/data/json-collection";
import { type ItemSource, ItemSourceSchema } from "../domain/item-source";
import type { ItemSourceRepository } from "../domain/item-source-repository";

export class JsonItemSourceRepository implements ItemSourceRepository {
  private readonly sources: JsonCollection<ItemSource>;

  constructor(load: JsonLoader) {
    this.sources = new JsonCollection(ItemSourceSchema, load, "item sources");
  }

  async getSourcedItemIds(): Promise<ReadonlySet<string>> {
    return new Set((await this.sources.all()).map((source) => source.itemId));
  }

  async findByItem(itemId: string): Promise<readonly ItemSource[]> {
    return (await this.sources.all())
      .filter((source) => source.itemId === itemId)
      .sort((a, b) => b.chance - a.chance || a.sourceName.en.localeCompare(b.sourceName.en));
  }
}
