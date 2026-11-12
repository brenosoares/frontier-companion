import { z } from "zod";
import { LocalizedTextSchema } from "@/shared/domain/localized-text";

/**
 * The game's build-menu categories: two main tabs (Constructs, Decorations) with sub-categories.
 * The data does not name a construct's sub-category, so the pipeline classifies each one with
 * explicit rules (`scripts/data-pipeline/extractors/construct-category.ts`).
 */
export const CONSTRUCT_CATEGORIES = [
  "constructs-crafting",
  "constructs-essentials",
  "constructs-farm",
  "constructs-storage",
  "constructs-modular",
  "decorations-arches",
  "decorations-fences",
  "decorations-furniture",
  "decorations-farm",
  "decorations-lights",
  "decorations-modular",
  "decorations-ornaments",
  "decorations-plants",
  "decorations-signs",
  "decorations-wall-mounted",
] as const;

export type ConstructCategory = (typeof CONSTRUCT_CATEGORIES)[number];

export type ConstructGroup = "constructs" | "decorations";

/** `decorations-wall-mounted` -> `decorations`. */
export function constructGroup(category: ConstructCategory): ConstructGroup {
  return category.startsWith("constructs-") ? "constructs" : "decorations";
}

const Id = z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/);

export const ConstructSchema = z.object({
  id: Id,
  name: LocalizedTextSchema,
  description: LocalizedTextSchema.nullable(),
  /** Icon file name (no extension), served at `/icons/constructs/<icon>.png`; null when unavailable. */
  icon: z.string().nullable(),
  category: z.enum(CONSTRUCT_CATEGORIES),
  /** Resources spent to build it. */
  costs: z.array(z.object({ itemId: Id, amount: z.number().int().positive() })),
  /** Comfort the game attributes to it (decorations mostly); 0 when none. */
  coziness: z.number().int().nonnegative(),
  /** Gating feature flag not known to be released, or null. */
  featureFlag: z.string().nullable(),
  /** Price of its blueprint at merchants, when sold there. */
  blueprintPrice: z.number().int().nonnegative().nullable(),
});

export type Construct = z.infer<typeof ConstructSchema>;
