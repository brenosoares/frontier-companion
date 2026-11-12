import { JsonCollection, type JsonLoader } from "@/shared/data/json-collection";
import { type ItemSource, type ItemSourceKind, ItemSourceSchema } from "../domain/item-source";
import type { ItemSourceRepository } from "../domain/item-source-repository";

export class JsonItemSourceRepository implements ItemSourceRepository {
  private readonly sources: JsonCollection<ItemSource>;

  constructor(load: JsonLoader) {
    this.sources = new JsonCollection(ItemSourceSchema, load, "item sources");
  }

  async getSourcedItemIds(except: readonly ItemSourceKind[] = []): Promise<ReadonlySet<string>> {
    const ignored = new Set<ItemSourceKind>(except);
    return new Set(
      (await this.sources.all())
        .filter((source) => !ignored.has(source.kind))
        .map((source) => source.itemId),
    );
  }

  async findByItem(itemId: string): Promise<readonly ItemSource[]> {
    return (await this.sources.all())
      .filter((source) => source.itemId === itemId)
      .sort(
        (a, b) =>
          (b.chance ?? -1) - (a.chance ?? -1) ||
          (a.sourceName?.en ?? a.kind).localeCompare(b.sourceName?.en ?? b.kind),
      );
  }
}
