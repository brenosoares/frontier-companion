import { z } from "zod";
import { LocalizedTextSchema } from "@/shared/domain/localized-text";

/** What an animal eats. It decides which fodder feeds it. */
export const DIETS = ["Nitrogenic", "Phosphoric", "Potassic"] as const;
export type Diet = (typeof DIETS)[number];

const Id = z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/);
const Days = z.number().int().nonnegative();

const LootSchema = z.object({ itemId: Id, amount: z.number().int().positive() });

/** What a critter does on the ranch: what it gives, what it needs and how it grows. */
export const RanchSchema = z.object({
  loot: z.object({ product: LootSchema, droppings: LootSchema }),
  needs: z.object({
    /** Water it drinks per day. */
    dailyThirst: z.number().int().nonnegative(),
    /** Fodder it eats per day. */
    dailyHunger: z.number().int().nonnegative(),
    /** Space it needs, in square meters. */
    minSquareMeters: z.number().int().positive(),
    /** Other animals that must be near for it to be happy. */
    minNearbyAnimals: z.number().int().nonnegative(),
  }),
  lifecycle: z.object({
    incubationDays: Days,
    growthDays: Days,
    /** Days of sadness before it runs away. */
    daysSadBeforeRunAway: Days,
    /** Days it stays away before it despawns. */
    daysRunAwayBeforeDespawn: Days,
  }),
});

/**
 * A creature of the game: every critter, whether or not it can be raised. All have a diet and what
 * they leave when fed in the wild; only some have ranch data.
 */
export const AnimalSchema = z.object({
  id: Id,
  name: LocalizedTextSchema,
  /** Icon file name (no extension), served at `/icons/animals/<icon>.png`; null when unavailable. */
  icon: z.string().nullable(),
  diet: z.enum(DIETS),
  /** The fodder item that feeds this diet. */
  fodderItemId: Id,
  /** What feeding the wild critter gives (from the game's blueprints). */
  wildFeeding: z.object({
    /** Resource it always leaves when fed. */
    resourceItemId: Id,
    /** Egg it may also leave (hatched in the Egg Incubator); null for critters with no egg. */
    egg: z.object({ itemId: Id, chance: z.number().gt(0).lte(100) }).nullable(),
  }),
  /** Null for critters that cannot be raised on the ranch. */
  ranch: RanchSchema.nullable(),
});

export type Animal = z.infer<typeof AnimalSchema>;
export type Ranch = z.infer<typeof RanchSchema>;

/** Egg Incubator defaults: chances a lens adds, and how long a rare egg takes. */
export const IncubatorSchema = z.object({
  lensChances: z.object({
    smaller: z.number().gt(0).lte(100),
    larger: z.number().gt(0).lte(100),
    double: z.number().gt(0).lte(100),
    rare: z.number().gt(0).lte(100),
  }),
  rareEggIncubationDays: z.number().int().positive(),
});

export type Incubator = z.infer<typeof IncubatorSchema>;
