import type { ItemSource, ItemSourceKind } from "./item-source";

export interface ItemSourceRepository {
  /**
   * Ids of the items with at least one known source. Sources of the `except` kinds are ignored,
   * e.g. `["mutation"]` leaves out items that only exist through a special process.
   */
  getSourcedItemIds(except?: readonly ItemSourceKind[]): Promise<ReadonlySet<string>>;
  /** Where the given item can be found, most likely first. */
  findByItem(itemId: string): Promise<readonly ItemSource[]>;
}
