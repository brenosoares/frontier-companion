import { z } from "zod";
import { type Construct, ConstructSchema } from "@/features/constructs/domain/construct";
import { RawTextSchema, toLocalizedText } from "../unreal/localized";
import { normalizeKeys, resolveFeatureFlag } from "../unreal/normalize";
import { resolveIcon } from "../unreal/icons";
import { classifyConstruct, parseEnumeratorIndex } from "./construct-category";

const RawConstructSchema = z.object({
  DisplayName: RawTextSchema,
  Description: RawTextSchema,
  Category: z.string(),
  Type: z.string(),
  VariantFamily: z.object({ TagName: z.string() }),
  FeatureFlag: z.object({ TagName: z.string() }),
  Icon: z.object({ AssetPathName: z.string() }),
  ItemCost: z.array(z.object({ Key: z.string(), Value: z.number() })),
  Coziness: z.number(),
});

const RawBlueprintEntrySchema = z.object({
  Type: z.string(),
  EntryId: z.string(),
  Cost: z.number(),
});

export interface ConstructOptions {
  availableIcons: ReadonlySet<string>;
  releasedFlags: ReadonlySet<string>;
  /** Construct id -> merchant blueprint price. */
  blueprintPrices: ReadonlyMap<string, number>;
}

/** Merchant entries of type Blueprint, keyed by the construct they unlock (cheapest wins). */
export function extractBlueprintPrices(entryRows: Record<string, unknown>): Map<string, number> {
  const prices = new Map<string, number>();
  for (const [key, row] of Object.entries(entryRows)) {
    const parsed = RawBlueprintEntrySchema.safeParse(row);
    if (!parsed.success) {
      throw new Error(
        `Merchant entry "${key}" has an unexpected shape\n${z.prettifyError(parsed.error)}`,
      );
    }
    const { Type, EntryId, Cost } = parsed.data;
    if (!Type.endsWith("::Blueprint")) continue;
    prices.set(EntryId, Math.min(prices.get(EntryId) ?? Cost, Cost));
  }
  return prices;
}

function toConstruct(id: string, row: unknown, options: ConstructOptions): Construct {
  const parsed = RawConstructSchema.safeParse(normalizeKeys(row));
  if (!parsed.success) {
    throw new Error(`Construct "${id}" has an unexpected shape\n${z.prettifyError(parsed.error)}`);
  }
  const raw = parsed.data;
  const name = toLocalizedText(raw.DisplayName);
  if (!name) throw new Error(`Construct "${id}": missing display name`);

  return ConstructSchema.parse({
    id,
    name,
    description: toLocalizedText(raw.Description),
    icon: resolveIcon(raw.Icon.AssetPathName, options.availableIcons),
    category: classifyConstruct(id, {
      tab: parseEnumeratorIndex(raw.Category),
      type: parseEnumeratorIndex(raw.Type),
      family: raw.VariantFamily.TagName.split(".").at(-1) ?? "None",
    }),
    costs: raw.ItemCost.map(({ Key, Value }) => ({ itemId: Key, amount: Value })),
    coziness: Math.round(raw.Coziness),
    featureFlag: resolveFeatureFlag(raw.FeatureFlag.TagName, options.releasedFlags),
    blueprintPrice: options.blueprintPrices.get(id) ?? null,
  });
}

export function extractConstructs(
  rows: Record<string, unknown>,
  options: ConstructOptions,
): Construct[] {
  return Object.entries(rows)
    .map(([id, row]) => toConstruct(id, row, options))
    .sort((a, b) => a.id.localeCompare(b.id));
}
