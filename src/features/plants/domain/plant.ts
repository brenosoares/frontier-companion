import { z } from "zod";
import { LocalizedTextSchema } from "@/shared/domain/localized-text";

/** Crops (wheat, caroot…) and the large plants a farmer tends (trees, colorflowers…). */
export const PLANT_KINDS = ["crop", "large"] as const;
export type PlantKind = (typeof PLANT_KINDS)[number];

/** The nutrient a crop belongs to; it decides which fertilizer and which animal diet it matches. */
export const CROP_TYPES = ["Nitrogenic", "Phosphoric", "Potassic"] as const;
export type CropType = (typeof CROP_TYPES)[number];

const Id = z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/);
const Days = z.number().int().nonnegative();

/** One thing a plant can drop. `chance` is the odds (0, 100] of getting at least one. */
export const PlantDropSchema = z
  .object({
    itemId: Id,
    minAmount: z.number().int().positive(),
    maxAmount: z.number().int().positive(),
    chance: z.number().gt(0).lte(100),
  })
  .refine((drop) => drop.minAmount <= drop.maxAmount, "minAmount must not exceed maxAmount");

export const PlantSchema = z.object({
  id: Id,
  name: LocalizedTextSchema,
  /** Icon file name (no extension), served at `/icons/plants/<icon>.png`; null when unavailable. */
  icon: z.string().nullable(),
  kind: z.enum(PLANT_KINDS),
  /** Only crops have a nutrient type. */
  cropType: z.enum(CROP_TYPES).nullable(),
  daysToMature: Days,
  daysToDry: Days,
  /** The seed item that grows it; null when the data names none. */
  seedItemId: Id.nullable(),
  /** What harvesting it gives. */
  drops: z.array(PlantDropSchema),
  /** Fruit the standing plant grows over time (large plants only). */
  fruit: z
    .object({
      daysToGrow: Days,
      /** How many fruits it grows in its lifetime. */
      maxLifetime: Days,
      drops: z.array(PlantDropSchema),
    })
    .nullable(),
  /** Breaking level a tool needs to cut it (large plants only). */
  breakingLevel: Days.nullable(),
});

export type PlantDrop = z.infer<typeof PlantDropSchema>;
export type Plant = z.infer<typeof PlantSchema>;
