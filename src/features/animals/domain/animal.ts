import { z } from "zod";
import { LocalizedTextSchema } from "@/shared/domain/localized-text";

/** What an animal eats. It decides which fodder feeds it. */
export const DIETS = ["Nitrogenic", "Phosphoric", "Potassic"] as const;
export type Diet = (typeof DIETS)[number];

const Id = z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/);
const Days = z.number().int().nonnegative();

const LootSchema = z.object({ itemId: Id, amount: z.number().int().positive() });

/** A ranch animal: what it needs, what it gives and how it grows. All numbers come from the game. */
export const AnimalSchema = z.object({
  id: Id,
  name: LocalizedTextSchema,
  /** Icon file name (no extension), served at `/icons/animals/<icon>.png`; null when unavailable. */
  icon: z.string().nullable(),
  diet: z.enum(DIETS),
  /** The fodder item that feeds this diet. */
  fodderItemId: Id,
  loot: z.object({
    product: LootSchema,
    droppings: LootSchema,
    /** The egg item (also how to get a new animal, through the Egg Incubator). */
    egg: z.object({ itemId: Id }),
  }),
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
  /** What happens when the wild critter of this species is fed (from the game's blueprints). */
  wildFeeding: z.object({
    /** Resource it always drops when fed. */
    resourceItemId: Id,
    /** Chance (0, 100] that feeding it also leaves its egg. */
    eggChance: z.number().gt(0).lte(100),
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

export type Animal = z.infer<typeof AnimalSchema>;

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
