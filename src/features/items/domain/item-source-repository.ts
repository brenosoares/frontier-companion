import type { ItemSource } from "./item-source";

export interface ItemSourceRepository {
  /** Ids of every item with at least one known source. */
  getSourcedItemIds(): Promise<ReadonlySet<string>>;
  /** Where the given item can be found, most likely first. */
  findByItem(itemId: string): Promise<readonly ItemSource[]>;
}
