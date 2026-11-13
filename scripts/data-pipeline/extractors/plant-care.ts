import { z } from "zod";
import {
  type PlantEffectEntry,
  PlantEffectSchema,
  type QualityRate,
  QualityRateSchema,
  QUALITIES,
} from "@/features/plants/domain/plant";
import { normalizeKeys, parseEnumValue } from "../unreal/normalize";

const RawReagentSchema = z.object({ Effect: z.string(), Potency: z.number() });

/**
 * Items that act as fertilizer reagents (`DT_FertilizerReagents`). The table has a spreadsheet
 * leftover row (`#N/A`) and may name items the game no longer has; rows for ids that are not items
 * are dropped with a warning instead of failing the build.
 */
export function extractPlantEffects(
  rows: Record<string, unknown>,
  itemIds: ReadonlySet<string>,
): { effects: PlantEffectEntry[]; warnings: string[] } {
  const warnings: string[] = [];
  const effects: PlantEffectEntry[] = [];
  for (const [id, row] of Object.entries(rows)) {
    if (!itemIds.has(id)) {
      warnings.push(`Dropped plant effect "${id}": not an item`);
      continue;
    }
    const parsed = RawReagentSchema.safeParse(normalizeKeys(row));
    if (!parsed.success) {
      throw new Error(
        `Plant effect "${id}" has an unexpected shape\n${z.prettifyError(parsed.error)}`,
      );
    }
    effects.push(
      PlantEffectSchema.parse({
        id,
        effect: parseEnumValue(parsed.data.Effect),
        potency: parsed.data.Potency,
      }),
    );
  }
  return { effects: effects.sort((a, b) => a.id.localeCompare(b.id)), warnings };
}

const RawQualityRowSchema = z.object({
  DropRates: z.array(z.object({ Key: z.string(), Value: z.number() })),
});

/**
 * `DT_QualityRates`: the key is a quality level and the value the weight of each harvest quality.
 * A quality the row leaves out has weight 0; an unknown quality fails the build.
 */
export function extractQualityRates(rows: Record<string, unknown>): QualityRate[] {
  return Object.entries(rows)
    .map(([id, row]) => {
      const parsed = RawQualityRowSchema.safeParse(normalizeKeys(row));
      if (!parsed.success) {
        throw new Error(
          `Quality level "${id}" has an unexpected shape\n${z.prettifyError(parsed.error)}`,
        );
      }
      const rates: Record<string, number> = Object.fromEntries(QUALITIES.map((q) => [q, 0]));
      for (const { Key, Value } of parsed.data.DropRates) {
        const quality = parseEnumValue(Key).toLowerCase();
        if (!(quality in rates)) throw new Error(`Quality level "${id}": unknown quality "${Key}"`);
        rates[quality] = Value;
      }
      return QualityRateSchema.parse({ id, level: Number(id), rates });
    })
    .sort((a, b) => a.level - b.level);
}
