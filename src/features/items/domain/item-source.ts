import { z } from "zod";
import { LocalizedTextSchema } from "@/shared/domain/localized-text";

/** How an item is obtained from a source. */
export const ITEM_SOURCE_KINDS = [
  "node",
  "plant",
  "animal-product",
  "animal-droppings",
  "animal-egg",
] as const;

export type ItemSourceKind = (typeof ITEM_SOURCE_KINDS)[number];

const Id = z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/);

/** One place where an item can be found (a node it drops from, a plant it grows on, an animal…). */
export const ItemSourceSchema = z
  .object({
    /** `<kind>:<sourceId>:<itemId>`: unique per (kind, source, item). */
    id: z.string().min(1),
    itemId: Id,
    kind: z.enum(ITEM_SOURCE_KINDS),
    sourceId: Id,
    sourceName: LocalizedTextSchema,
    minAmount: z.number().int().positive(),
    maxAmount: z.number().int().positive(),
    /** Percentage (0, 100] that at least one unit drops. */
    chance: z.number().gt(0).lte(100),
  })
  .refine((source) => source.maxAmount >= source.minAmount, {
    message: "maxAmount must be >= minAmount",
    path: ["maxAmount"],
  });

export type ItemSource = z.infer<typeof ItemSourceSchema>;
