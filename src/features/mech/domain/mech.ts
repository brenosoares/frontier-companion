import { z } from "zod";
import { LocalizedTextSchema } from "@/shared/domain/localized-text";

/**
 * What a chip or a part belongs to. Body parts first, then tools, then transform modes: the order
 * players meet them in, and the order the hub lists them.
 */
export const PART_CATEGORIES = [
  "engine",
  "windshield",
  "arms",
  "legs",
  "spike-saw",
  "irrigation-hose",
  "resource-vacuum",
  "seed-shooter",
  "sprout-cannon",
  "plow",
  "harvester",
  "fertilizer-spreader",
  "trailblazer",
  "landscaper",
  "skyblazer",
] as const;

export type PartCategory = (typeof PART_CATEGORIES)[number];

export type PartGroup = "body" | "tools" | "transform";

const BODY: readonly PartCategory[] = ["engine", "windshield", "arms", "legs"];
const TOOLS: readonly PartCategory[] = [
  "spike-saw",
  "irrigation-hose",
  "resource-vacuum",
  "seed-shooter",
  "sprout-cannon",
];

export function partGroup(category: PartCategory): PartGroup {
  if (BODY.includes(category)) return "body";
  return TOOLS.includes(category) ? "tools" : "transform";
}

/** Chips with no part they fit (they only say "unique", or nothing) are listed under this. */
export const GENERAL_CHIPS = "general";

export type ChipCategory = PartCategory | typeof GENERAL_CHIPS;

const Id = z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/);
const Cost = z.object({ itemId: Id, amount: z.number().int().positive() });

/** How the game shows a stat's value. Inferred per stat from the game's display format (ADR 0014). */
export const STAT_KINDS = ["number", "percent", "unlock"] as const;

export const MechStatSchema = z.object({
  /** The game's stat tag without the `Upgrade.` prefix, e.g. `Health.Max`. */
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_.]*$/),
  name: LocalizedTextSchema,
  kind: z.enum(STAT_KINDS),
});

const StatValueSchema = z.object({ stat: z.string(), value: z.number() });

/** One tier of a mech part: an Irrigation Hose Mk. 3, an Underframe Engine, a Vintage Leg Set… */
export const MechPartSchema = z.object({
  id: Id,
  name: LocalizedTextSchema,
  description: LocalizedTextSchema.nullable(),
  /** Icon file name (no extension), served at `/icons/mech/<icon>.png`; null when unavailable. */
  icon: z.string().nullable(),
  category: z.enum(PART_CATEGORIES),
  /** 1 for the first tier of its category (the one you start with or build first). */
  tier: z.number().int().positive(),
  /** Resources to build it; empty when the game lists none (the starting parts). */
  costs: z.array(Cost),
  stats: z.array(StatValueSchema),
  featureFlag: z.string().nullable(),
});

/** A chip: an upgrade installed in a part's mod slots, paid with resources and power. */
export const MechChipSchema = z.object({
  id: Id,
  name: LocalizedTextSchema,
  description: LocalizedTextSchema.nullable(),
  icon: z.string().nullable(),
  /** Power it draws from the mech. */
  powerCost: z.number().int().nonnegative(),
  costs: z.array(Cost),
  /** Categories of part it can be installed in; empty for chips that name none. */
  fits: z.array(z.enum(PART_CATEGORIES)),
  /** The game marks it "unique": one per mech. */
  unique: z.boolean(),
  featureFlag: z.string().nullable(),
});

export type MechStat = z.infer<typeof MechStatSchema>;
export type MechPart = z.infer<typeof MechPartSchema>;
export type MechChip = z.infer<typeof MechChipSchema>;
