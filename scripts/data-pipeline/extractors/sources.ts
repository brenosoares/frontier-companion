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
const RawDropsSchema = z.array(z.object({ ItemName: z.string(), Counts: RawCountsSchema }));

const RawNodeSchema = z.object({ DisplayName: RawTextSchema, Drops: RawDropsSchema });
const RawPlantSchema = z.object({
  DisplayName: RawTextSchema,
  IsNode: z.boolean().optional(),
  PlantDrops: RawDropsSchema,
});
const RawAnimalSchema = z.object({
  ItemDrop: z.object({ ItemName: z.string(), Count: z.number() }),
  Dropping: z.object({ ItemName: z.string(), Count: z.number() }),
  EggItem: z.string(),
});
const RawCritterSchema = z.object({ DisplayName: RawTextSchema });

interface SourceRef {
  kind: ItemSourceKind;
  sourceId: string;
  sourceName: LocalizedText;
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

function buildSource(
  ref: SourceRef,
  itemId: string,
  minAmount: number,
  maxAmount: number,
  chance: number,
): ItemSource {
  return ItemSourceSchema.parse({
    id: `${ref.kind}:${ref.sourceId}:${itemId}`,
    itemId,
    kind: ref.kind,
    sourceId: ref.sourceId,
    sourceName: ref.sourceName,
    minAmount,
    maxAmount,
    chance,
  });
}

/** Turns a weighted quantity table into "chance of at least one" and the quantity range. */
function dropsToSources(ref: SourceRef, drops: z.infer<typeof RawDropsSchema>): ItemSource[] {
  return drops.flatMap(({ ItemName, Counts }) => {
    const total = Counts.reduce((sum, { Value }) => sum + Value, 0);
    const positive = Counts.map(({ Key, Value }) => ({
      amount: Number(Key),
      weight: Value,
    })).filter(({ amount, weight }) => amount > 0 && weight > 0);
    if (total <= 0 || positive.length === 0) return [];

    const hit = positive.reduce((sum, { weight }) => sum + weight, 0);
    const amounts = positive.map(({ amount }) => amount);
    const chance = Math.round((hit / total) * 10_000) / 100;
    return [buildSource(ref, ItemName, Math.min(...amounts), Math.max(...amounts), chance)];
  });
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
      const ref = {
        kind: "plant",
        sourceId,
        sourceName: requireName(plant.DisplayName, sourceId),
      } as const;
      return dropsToSources(ref, plant.PlantDrops);
    }),
  );
}

/** What a ranch animal yields: a product, droppings and an egg (names come from `DT_Critters`). */
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
      ["animal-egg", animal.EggItem, 1],
    ] as const;
    return yields.map(([kind, itemId, count]) =>
      buildSource({ kind, sourceId, sourceName }, itemId, count, count, 100),
    );
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
    } else if (isUnfinished(source.sourceName.en)) {
      warnings.push(`Dropped item source "${source.id}": unfinished or obsolete content`);
    } else {
      kept.push(source);
    }
  }
  return { kept, warnings };
}
