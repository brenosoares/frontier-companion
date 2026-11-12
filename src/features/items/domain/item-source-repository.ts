import type { ItemSource } from "./item-source";

export interface ItemSourceRepository {
  /** Where the given item can be found, most likely first. */
  findByItem(itemId: string): Promise<readonly ItemSource[]>;
}
