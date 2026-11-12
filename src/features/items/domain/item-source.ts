import { z } from "zod";
import { LocalizedTextSchema } from "@/shared/domain/localized-text";

/** How an item is obtained from a source. */
export const ITEM_SOURCE_KINDS = [
  "node",
  "plant",
  "plant-fruit",
  "animal-product",
  "animal-droppings",
  /** Feeding the wild critter at `sourceId`: it drops a resource and may leave an egg. */
  "critter-feed",
  /** Cutting or breaking the large item at `sourceId` (an item such as the Aluminum Chunk). */
  "large-item",
  "hazard",
  "loot-goblin",
  /** Harvested from a mutated plant grown from the item at `sourceId` (modified seeds). */
  "mutation",
  "merchant",
  "care-package",
] as const;

export type ItemSourceKind = (typeof ITEM_SOURCE_KINDS)[number];

const Id = z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/);

/**
 * One place where an item can be found: a node it drops from, a plant it grows on, a merchant…
 * What the game data does not state is `null`: never guessed.
 */
export const ItemSourceSchema = z
  .object({
    /** `<kind>:<sourceId>:<itemId>`: unique per (kind, source, item). */
    id: z.string().min(1),
    itemId: Id,
    kind: z.enum(ITEM_SOURCE_KINDS),
    /** Node/plant/merchant bundle id; for `mutation`, the id of the seed item. */
    sourceId: Id,
    /** Null when the source has no name of its own (merchants, care packages). */
    sourceName: LocalizedTextSchema.nullable(),
    /** Quantity range when the data gives one, otherwise null. */
    minAmount: z.number().int().positive().nullable(),
    maxAmount: z.number().int().positive().nullable(),
    /** Percentage (0, 100] that at least one unit drops, when the data gives it. */
    chance: z.number().gt(0).lte(100).nullable(),
    /** What a merchant charges, when it sells the item. */
    price: z.number().int().nonnegative().nullable(),
  })
  .refine((source) => (source.minAmount === null) === (source.maxAmount === null), {
    message: "minAmount and maxAmount must both be set or both be null",
    path: ["maxAmount"],
  })
  .refine(
    (source) =>
      source.minAmount === null ||
      source.maxAmount === null ||
      source.maxAmount >= source.minAmount,
    { message: "maxAmount must be >= minAmount", path: ["maxAmount"] },
  );

export type ItemSource = z.infer<typeof ItemSourceSchema>;
