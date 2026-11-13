import { z } from "zod";
import type { Incubator } from "@/features/animals/domain/animal";
import { IncubatorSchema } from "@/features/animals/domain/animal";
import {
  type ItemSource,
  type ItemSourceKind,
  ItemSourceSchema,
} from "@/features/items/domain/item-source";
import type { LocalizedText } from "@/shared/domain/localized-text";

/** Where the blueprints we read live, relative to `Content/Blueprints`. */
export const BLUEPRINT_PATHS = {
  largeItemsDirectory: "Resources/LargeItems",
  hazardBreakable: "Hazards/BP_HazardBreakable.json",
  lootGoblin: "Creatures/BP_LootGoblin.json",
  critterParent: "Creatures/BP_CritterCharacter.json",
  eggIncubator: "Constructs/BP_EggIncubatorConstruct.json",
  /** `BP_<Id>.json` of a wild critter. */
  critter: (id: string) => `Creatures/${id}/BP_${id}.json`,
} as const;

const DefaultObjectSchema = z.object({
  Name: z.string(),
  Properties: z.record(z.string(), z.unknown()),
});

/**
 * A Blueprint export is a list of objects; the class defaults are the one named `Default__…`.
 * Returns its properties, or throws naming the file when there is none.
 */
export function blueprintDefaults(json: unknown, label: string): Record<string, unknown> {
  if (!Array.isArray(json)) throw new Error(`${label}: not a Blueprint export`);
  for (const entry of json) {
    const parsed = DefaultObjectSchema.safeParse(entry);
    if (parsed.success && parsed.data.Name.startsWith("Default__")) return parsed.data.Properties;
  }
  throw new Error(`${label}: no Default__ object`);
}

function parse<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`${label} has an unexpected shape\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

function source(
  kind: ItemSourceKind,
  sourceId: string,
  sourceName: LocalizedText | null,
  itemId: string,
  details: { amount?: number; chance?: number } = {},
): ItemSource {
  return ItemSourceSchema.parse({
    id: `${kind}:${sourceId}:${itemId}`,
    itemId,
    kind,
    sourceId,
    sourceName,
    minAmount: details.amount ?? null,
    maxAmount: details.amount ?? null,
    chance: details.chance ?? null,
    price: null,
  });
}

// ---------------------------------------------------------------- large items

const LargeItemSchema = z.object({
  EngineName: z.string().optional(),
  ItemDrops: z
    .array(z.object({ ItemName: z.string(), Count: z.number().int().positive() }))
    .optional(),
});

/**
 * Large items (an Aluminum Chunk, a Large Coal rock…) break into a fixed number of items. Only the
 * ones that are themselves items are listed, because they link to their own page.
 */
export function extractLargeItemSources(
  blueprints: readonly { label: string; defaults: Record<string, unknown> }[],
  itemNames: ReadonlyMap<string, LocalizedText>,
): ItemSource[] {
  return blueprints.flatMap(({ label, defaults }) => {
    const large = parse(LargeItemSchema, defaults, label);
    const name = large.EngineName ? itemNames.get(large.EngineName) : undefined;
    if (!large.EngineName || !name) return [];
    return (large.ItemDrops ?? []).map(({ ItemName, Count }) =>
      source("large-item", large.EngineName!, name, ItemName, { amount: Count, chance: 100 }),
    );
  });
}

// -------------------------------------------------------------------- hazards

const HazardSchema = z.object({
  ItemDrops: z
    .array(
      z.object({
        ItemName: z.string(),
        Counts: z.array(z.object({ Key: z.string(), Value: z.number() })),
      }),
    )
    .optional(),
});

/** What the breakable hazards drop (the Noxious Pod). The data names no hazard, so none is shown. */
export function extractHazardSources(defaults: Record<string, unknown>): ItemSource[] {
  const hazard = parse(HazardSchema, defaults, "Hazard breakable");
  return (hazard.ItemDrops ?? []).flatMap(({ ItemName, Counts }) => {
    const total = Counts.reduce((sum, { Value }) => sum + Value, 0);
    const hit = Counts.filter(({ Key }) => Number(Key) > 0).reduce(
      (sum, { Value }) => sum + Value,
      0,
    );
    if (total <= 0 || hit <= 0) return [];
    const amounts = Counts.filter(({ Key, Value }) => Number(Key) > 0 && Value > 0).map(({ Key }) =>
      Number(Key),
    );
    return [
      ItemSourceSchema.parse({
        id: `hazard:HazardBreakable:${ItemName}`,
        itemId: ItemName,
        kind: "hazard",
        sourceId: "HazardBreakable",
        sourceName: null,
        minAmount: Math.min(...amounts),
        maxAmount: Math.max(...amounts),
        chance: Math.round((hit / total) * 10_000) / 100,
        price: null,
      }),
    ];
  });
}

// ---------------------------------------------------------------- loot goblin

const LootGoblinSchema = z.object({
  ItemPools: z.array(
    z.object({
      Key: z.string(),
      Value: z.object({ Items: z.array(z.object({ ItemName: z.string() })) }),
    }),
  ),
  DropTable: z.array(z.object({ PoolName: z.string() })),
});

/**
 * Every item in a pool the Loot Goblin can drop. How many and how often depends on the player's
 * milestone, so neither amount nor chance is given.
 */
export function extractLootGoblinSources(defaults: Record<string, unknown>): ItemSource[] {
  const goblin = parse(LootGoblinSchema, defaults, "Loot Goblin");
  const usedPools = new Set(goblin.DropTable.map(({ PoolName }) => PoolName));
  const items = new Set(
    goblin.ItemPools.filter(({ Key }) => usedPools.has(Key)).flatMap(({ Value }) =>
      Value.Items.map(({ ItemName }) => ItemName),
    ),
  );
  return [...items].map((itemId) => source("loot-goblin", "LootGoblin", null, itemId));
}

const percent = (fraction: number) => Math.round(fraction * 10_000) / 100;

// ---------------------------------------------------------- feeding wild critters

const CritterSchema = z.object({
  FeedResourceItem: z.string(),
  FeedEggItem: z.string().optional(),
  FeedEggChance: z.number().optional(),
});
const CritterParentSchema = z.object({ FeedDropChance: z.number() });

export interface WildFeeding {
  resourceItemId: string;
  /** The egg a fed critter may leave and its chance in percent; null when it has none. */
  egg: { itemId: string; chance: number } | null;
}

/** What a wild critter gives when fed; the parent class says how likely the resource is. */
export function extractWildFeeding(
  critterDefaults: Record<string, unknown>,
  parentDefaults: Record<string, unknown>,
  critterId: string,
): WildFeeding & { resourceChance: number } {
  const critter = parse(CritterSchema, critterDefaults, `Critter "${critterId}"`);
  const parent = parse(CritterParentSchema, parentDefaults, "Critter parent");
  if ((critter.FeedEggItem === undefined) !== (critter.FeedEggChance === undefined)) {
    throw new Error(`Critter "${critterId}": egg item and egg chance must come together`);
  }
  return {
    resourceItemId: critter.FeedResourceItem,
    egg:
      critter.FeedEggItem !== undefined && critter.FeedEggChance !== undefined
        ? { itemId: critter.FeedEggItem, chance: percent(critter.FeedEggChance) }
        : null,
    resourceChance: percent(parent.FeedDropChance),
  };
}

/** The resource (always, per the parent class) and the egg (when it has one) a fed critter leaves. */
export function critterFeedSources(
  critterId: string,
  critterName: LocalizedText,
  feeding: WildFeeding & { resourceChance: number },
): ItemSource[] {
  return [
    source("critter-feed", critterId, critterName, feeding.resourceItemId, {
      chance: feeding.resourceChance,
    }),
    ...(feeding.egg
      ? [
          source("critter-feed", critterId, critterName, feeding.egg.itemId, {
            chance: feeding.egg.chance,
          }),
        ]
      : []),
  ];
}

// ------------------------------------------------------------------ incubator

const IncubatorBlueprintSchema = z.object({
  ChanceToSpawnSmall: z.number(),
  ChanceToSpawnLarge: z.number(),
  ChanceToSpawnDouble: z.number(),
  ChanceToSpawnRare: z.number(),
  RareEggIncubationTime: z.number(),
  EggToAnimal: z.array(z.object({ Key: z.string(), Value: z.string() })),
});

/**
 * The Egg Incubator's lens chances and the egg -> animal table. The table is returned so the
 * caller can check that each animal's egg really hatches that animal.
 */
export function extractIncubator(defaults: Record<string, unknown>): {
  incubator: Incubator;
  eggToAnimal: ReadonlyMap<string, string>;
} {
  const raw = parse(IncubatorBlueprintSchema, defaults, "Egg Incubator");
  const eggToAnimal = new Map(
    raw.EggToAnimal.map(({ Key, Value }) => {
      // `/Game/…/BP_TookanEggPickup.BP_TookanEggPickup_C` -> `TookanEgg`
      const file = Key.slice(Key.lastIndexOf("/") + 1).split(".")[0] ?? "";
      return [file.replace(/^BP_/, "").replace(/Pickup$/, ""), Value] as const;
    }),
  );
  return {
    incubator: IncubatorSchema.parse({
      lensChances: {
        smaller: percent(raw.ChanceToSpawnSmall),
        larger: percent(raw.ChanceToSpawnLarge),
        double: percent(raw.ChanceToSpawnDouble),
        rare: percent(raw.ChanceToSpawnRare),
      },
      rareEggIncubationDays: raw.RareEggIncubationTime,
    }),
    eggToAnimal,
  };
}
