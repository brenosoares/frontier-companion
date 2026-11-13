import { z } from "zod";
import { type Plant, PlantSchema } from "@/features/plants/domain/plant";
import { isUnfinished } from "../quality/unfinished";
import { resolveIcon } from "../unreal/icons";
import { RawTextSchema, toLocalizedText } from "../unreal/localized";
import { normalizeKeys, parseEnumValue } from "../unreal/normalize";
import { RawDropsSchema, summarizeDrops } from "./sources";

const RawSmallPlantSchema = z.object({
  DisplayName: RawTextSchema,
  Type: z.string(),
  DaysToDry: z.number(),
  DaysToMature: z.number(),
  PlantDrops: RawDropsSchema,
  Icon: z.object({ AssetPathName: z.string() }),
});

const RawLargePlantSchema = z.object({
  DisplayName: RawTextSchema,
  IsNode: z.boolean(),
  DaysToDry: z.number(),
  DaysToMature: z.number(),
  DaysToGrowFruit: z.number(),
  MaxLifetimeFruits: z.number(),
  MinBreakingLevel: z.number(),
  PlantDrops: RawDropsSchema,
  FruitDrops: RawDropsSchema,
  Icon: z.object({ AssetPathName: z.string() }),
});

const RawSeedSchema = z.object({ Name: z.string() });

export interface PlantOptions {
  availableIcons: ReadonlySet<string>;
}

function parseRow<T>(schema: z.ZodType<T>, row: unknown, label: string): T {
  const parsed = schema.safeParse(normalizeKeys(row));
  if (!parsed.success) {
    throw new Error(`${label} has an unexpected shape\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

/**
 * Plants a farmer grows: every crop (`DT_SmallPlants`) and the large plants that are not scenery
 * (`DT_LargePlants` rows with `IsNode` false: trees and flowers you tend, not the ones already
 * standing in the world). The seed comes from `DT_PlantToSeed`.
 */
export function extractPlants(
  smallRows: Record<string, unknown>,
  largeRows: Record<string, unknown>,
  seedRows: Record<string, unknown>,
  { availableIcons }: PlantOptions,
): { plants: Plant[]; warnings: string[] } {
  const seedOf = (id: string) => {
    const row = seedRows[id];
    return row === undefined ? null : parseRow(RawSeedSchema, row, `Seed of "${id}"`).Name;
  };
  const warnings: string[] = [];
  const plants: Plant[] = [];

  const keep = (id: string, name: ReturnType<typeof toLocalizedText>) => {
    if (!name) throw new Error(`Plant "${id}" has no display name`);
    if (isUnfinished(name.en)) {
      warnings.push(`Dropped plant "${id}": unfinished or obsolete content`);
      return null;
    }
    return name;
  };

  for (const [id, row] of Object.entries(smallRows)) {
    const raw = parseRow(RawSmallPlantSchema, row, `Plant "${id}"`);
    const name = keep(id, toLocalizedText(raw.DisplayName));
    if (!name) continue;
    plants.push(
      PlantSchema.parse({
        id,
        name,
        icon: resolveIcon(raw.Icon.AssetPathName, availableIcons),
        kind: "crop",
        cropType: parseEnumValue(raw.Type),
        daysToMature: raw.DaysToMature,
        daysToDry: raw.DaysToDry,
        seedItemId: seedOf(id),
        drops: summarizeDrops(raw.PlantDrops),
        fruit: null,
        breakingLevel: null,
      }),
    );
  }

  for (const [id, row] of Object.entries(largeRows)) {
    const raw = parseRow(RawLargePlantSchema, row, `Plant "${id}"`);
    if (raw.IsNode) continue;
    const name = keep(id, toLocalizedText(raw.DisplayName));
    if (!name) continue;
    const fruitDrops = summarizeDrops(raw.FruitDrops);
    plants.push(
      PlantSchema.parse({
        id,
        name,
        icon: resolveIcon(raw.Icon.AssetPathName, availableIcons),
        kind: "large",
        cropType: null,
        daysToMature: raw.DaysToMature,
        daysToDry: raw.DaysToDry,
        seedItemId: seedOf(id),
        drops: summarizeDrops(raw.PlantDrops),
        fruit:
          fruitDrops.length > 0
            ? {
                daysToGrow: raw.DaysToGrowFruit,
                maxLifetime: raw.MaxLifetimeFruits,
                drops: fruitDrops,
              }
            : null,
        breakingLevel: raw.MinBreakingLevel,
      }),
    );
  }

  return { plants: plants.sort((a, b) => a.id.localeCompare(b.id)), warnings };
}
