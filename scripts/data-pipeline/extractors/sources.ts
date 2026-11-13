import { z } from "zod";
import {
  type ItemSource,
  type ItemSourceKind,
  ItemSourceSchema,
} from "@/features/items/domain/item-source";
import type { LocalizedText } from "@/shared/domain/localized-text";
import { isUnfinished } from "../quality/unfinished";
import { RawTextSchema, toLocalizedText } from "../unreal/localized";
import { normalizeKeys } from "../unreal/normalize";

/** `{ Key: "3", Value: 70 }` = a quantity of 3 with weight 70. Weights need not sum to 100. */
const RawCountsSchema = z.array(z.object({ Key: z.string(), Value: z.number() }));
export const RawDropsSchema = z.array(z.object({ ItemName: z.string(), Counts: RawCountsSchema }));

const RawNodeSchema = z.object({ DisplayName: RawTextSchema, Drops: RawDropsSchema });
const RawPlantSchema = z.object({
  DisplayName: RawTextSchema,
  IsNode: z.boolean().optional(),
  PlantDrops: RawDropsSchema,
  /** Fruit the standing plant grows (colorflowers, glo fruit…), separate from its harvest. */
  FruitDrops: RawDropsSchema.optional(),
});
const RawAnimalSchema = z.object({
  ItemDrop: z.object({ ItemName: z.string(), Count: z.number() }),
  Dropping: z.object({ ItemName: z.string(), Count: z.number() }),
});
const RawCritterSchema = z.object({ DisplayName: RawTextSchema });
const RawMerchantEntrySchema = z.object({
  Bundle: z.string(),
  Type: z.string(),
  EntryId: z.string(),
  Cost: z.number(),
});
const RawCarePackageSchema = z.object({
  Kind: z.string(),
  Pool: z.array(z.string()).optional(),
});

interface SourceRef {
  kind: ItemSourceKind;
  sourceId: string;
  sourceName: LocalizedText | null;
}

/** What a source says about an item; every field is optional because the data may not say. */
interface SourceDetails {
  minAmount?: number;
  maxAmount?: number;
  chance?: number;
  price?: number;
}

function parseRow<T>(schema: z.ZodType<T>, row: unknown, label: string): T {
  const parsed = schema.safeParse(normalizeKeys(row));
  if (!parsed.success) {
    throw new Error(`${label} has an unexpected shape\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

function requireName(raw: z.infer<typeof RawTextSchema>, label: string): LocalizedText {
  const name = toLocalizedText(raw);
  if (!name) throw new Error(`${label} has no display name`);
  return name;
}

function buildSource(ref: SourceRef, itemId: string, details: SourceDetails = {}): ItemSource {
  return ItemSourceSchema.parse({
    id: `${ref.kind}:${ref.sourceId}:${itemId}`,
    itemId,
    kind: ref.kind,
    sourceId: ref.sourceId,
    sourceName: ref.sourceName,
    minAmount: details.minAmount ?? null,
    maxAmount: details.maxAmount ?? null,
    chance: details.chance ?? null,
    price: details.price ?? null,
  });
}

/** One drop table entry, summarised: the odds of at least one, and the quantity range. */
export interface DropSummary {
  itemId: string;
  minAmount: number;
  maxAmount: number;
  /** Percent, (0, 100]. */
  chance: number;
}

/**
 * Turns weighted quantity tables (`{ Key: "3", Value: 70 }` = a quantity of 3 with weight 70) into
 * "chance of at least one" and the quantity range. Entries that can never drop are left out.
 */
export function summarizeDrops(drops: z.infer<typeof RawDropsSchema>): DropSummary[] {
  return drops.flatMap(({ ItemName, Counts }) => {
    const total = Counts.reduce((sum, { Value }) => sum + Value, 0);
    const positive = Counts.map(({ Key, Value }) => ({
      amount: Number(Key),
      weight: Value,
    })).filter(({ amount, weight }) => amount > 0 && weight > 0);
    if (total <= 0 || positive.length === 0) return [];

    const hit = positive.reduce((sum, { weight }) => sum + weight, 0);
    const amounts = positive.map(({ amount }) => amount);
    return [
      {
        itemId: ItemName,
        minAmount: Math.min(...amounts),
        maxAmount: Math.max(...amounts),
        chance: Math.round((hit / total) * 10_000) / 100,
      },
    ];
  });
}

function dropsToSources(ref: SourceRef, drops: z.infer<typeof RawDropsSchema>): ItemSource[] {
  return summarizeDrops(drops).map(({ itemId, ...details }) => buildSource(ref, itemId, details));
}

/** Items dropped when a node (tree, rock, ore…) is broken. */
export function extractNodeSources(nodeRows: Record<string, unknown>): ItemSource[] {
  return Object.entries(nodeRows).flatMap(([sourceId, row]) => {
    const node = parseRow(RawNodeSchema, row, `Node "${sourceId}"`);
    const ref = {
      kind: "node",
      sourceId,
      sourceName: requireName(node.DisplayName, sourceId),
    } as const;
    return dropsToSources(ref, node.Drops);
  });
}

/**
 * Items harvested from plants. Large plants flagged `IsNode` are trees/bushes that already come from
 * `DT_Nodes`, so they are skipped here to avoid listing the same source twice.
 */
export function extractPlantSources(
  plantTables: readonly Record<string, unknown>[],
  nodeIds: ReadonlySet<string>,
): ItemSource[] {
  return plantTables.flatMap((rows) =>
    Object.entries(rows).flatMap(([sourceId, row]) => {
      const plant = parseRow(RawPlantSchema, row, `Plant "${sourceId}"`);
      if (plant.IsNode && nodeIds.has(sourceId)) return [];
      const sourceName = requireName(plant.DisplayName, sourceId);
      return [
        ...dropsToSources({ kind: "plant", sourceId, sourceName }, plant.PlantDrops),
        ...dropsToSources({ kind: "plant-fruit", sourceId, sourceName }, plant.FruitDrops ?? []),
      ];
    }),
  );
}

/** What a ranch animal yields: a product and droppings (names come from `DT_Critters`). */
export function extractAnimalSources(
  animalRows: Record<string, unknown>,
  critterRows: Record<string, unknown>,
): ItemSource[] {
  return Object.entries(animalRows).flatMap(([sourceId, row]) => {
    const animal = parseRow(RawAnimalSchema, row, `Ranch animal "${sourceId}"`);
    const critterRow = critterRows[sourceId];
    if (critterRow === undefined)
      throw new Error(`Ranch animal "${sourceId}" has no critter entry`);
    const critter = parseRow(RawCritterSchema, critterRow, `Critter "${sourceId}"`);
    const sourceName = requireName(critter.DisplayName, sourceId);

    const yields = [
      ["animal-product", animal.ItemDrop.ItemName, animal.ItemDrop.Count],
      ["animal-droppings", animal.Dropping.ItemName, animal.Dropping.Count],
    ] as const;
    return yields.map(([kind, itemId, count]) =>
      buildSource({ kind, sourceId, sourceName }, itemId, {
        minAmount: count,
        maxAmount: count,
        chance: 100,
      }),
    );
  });
}

/**
 * Items merchants sell (`Type = Item`), with their price. Blueprints, mech parts and the like are
 * not items. An item sold in several bundles keeps its cheapest offer.
 */
export function extractMerchantSources(entryRows: Record<string, unknown>): ItemSource[] {
  const cheapest = new Map<string, { bundle: string; cost: number }>();
  for (const [key, row] of Object.entries(entryRows)) {
    const entry = parseRow(RawMerchantEntrySchema, row, `Merchant entry "${key}"`);
    if (!entry.Type.endsWith("::Item")) continue;
    const best = cheapest.get(entry.EntryId);
    if (!best || entry.Cost < best.cost) {
      cheapest.set(entry.EntryId, { bundle: entry.Bundle, cost: entry.Cost });
    }
  }
  return [...cheapest].map(([itemId, { bundle, cost }]) =>
    buildSource({ kind: "merchant", sourceId: bundle, sourceName: null }, itemId, { price: cost }),
  );
}

/**
 * Items that can arrive in a care package. The data lists the pool but not the quantity or the
 * chance of each item, so those stay unknown.
 */
export function extractCarePackageSources(rewardRows: Record<string, unknown>): ItemSource[] {
  return Object.entries(rewardRows).flatMap(([rewardId, row]) => {
    const reward = parseRow(RawCarePackageSchema, row, `Care package "${rewardId}"`);
    const isItemPool =
      reward.Kind.endsWith("::Resources") || reward.Kind.endsWith("::FrameResource");
    if (!isItemPool) return [];
    return (reward.Pool ?? []).map((itemId) =>
      buildSource({ kind: "care-package", sourceId: rewardId, sourceName: null }, itemId),
    );
  });
}

/** A mutated crop `X_Rare` grows from the modified seeds `XSeeds_Refined`. */
const MUTATED_SUFFIX = "_Rare";

/**
 * The data never links a mutated crop to its seeds: it is code-driven. The link is inferred from
 * the naming pattern (`Wheat_Rare` <- `WheatSeeds_Refined`), which the game's own seed text
 * confirms ("Grows into a Mutated Wheat") and which holds for every mutated crop.
 */
export function extractMutationSources(
  items: readonly { id: string; name: LocalizedText }[],
): ItemSource[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return items.flatMap(({ id }) => {
    if (!id.endsWith(MUTATED_SUFFIX)) return [];
    const seed = byId.get(`${id.slice(0, -MUTATED_SUFFIX.length)}Seeds_Refined`);
    if (!seed) return [];
    return [buildSource({ kind: "mutation", sourceId: seed.id, sourceName: seed.name }, id)];
  });
}

/** Deterministic order so diffs between game versions stay readable. */
export function sortSources(sources: readonly ItemSource[]): ItemSource[] {
  return [...sources].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Keeps only sources a player can rely on. Drops (and reports) sources that reference an item that
 * does not exist, or that come from unfinished or obsolete content, instead of failing the whole build.
 */
export function filterUsableSources(
  sources: readonly ItemSource[],
  itemIds: ReadonlySet<string>,
): { kept: ItemSource[]; warnings: string[] } {
  const kept: ItemSource[] = [];
  const warnings: string[] = [];

  for (const source of sources) {
    if (!itemIds.has(source.itemId)) {
      warnings.push(`Dropped item source "${source.id}": the game data references an unknown item`);
    } else if (source.sourceName !== null && isUnfinished(source.sourceName.en)) {
      warnings.push(`Dropped item source "${source.id}": unfinished or obsolete content`);
    } else {
      kept.push(source);
    }
  }
  return { kept, warnings };
}

/**
 * Some ids differ from the item's only by letter case (`SoftwoodLog` vs `SoftWoodLog`). When the
 * only difference is case, the source is re-pointed at the real item instead of being dropped.
 */
export function reconcileItemIdCase(
  sources: readonly ItemSource[],
  itemIds: ReadonlySet<string>,
): ItemSource[] {
  const byLowercase = new Map([...itemIds].map((id) => [id.toLowerCase(), id]));
  return sources.map((source) => {
    if (itemIds.has(source.itemId)) return source;
    const real = byLowercase.get(source.itemId.toLowerCase());
    if (!real) return source;
    const prefix = `${source.kind}:${source.sourceId}:`;
    return { ...source, itemId: real, id: `${prefix}${real}` };
  });
}
