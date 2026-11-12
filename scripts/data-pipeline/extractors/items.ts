import { z } from "zod";
import { type Item, ItemSchema } from "@/features/items/domain/item";
import { toLocalizedText, RawTextSchema } from "../unreal/localized";
import { assetStem, parseEnumValue, parseFeatureFlag } from "../unreal/normalize";

const RawItemSchema = z.object({
  EngineName: z.string(),
  DisplayName: RawTextSchema,
  Description: RawTextSchema,
  Tags: z.array(z.string()),
  VirtualType: z.string(),
  FeatureFlag: z.object({ TagName: z.string() }),
  Icon: z.object({ AssetPathName: z.string() }),
  Weight: z.number(),
  SellValue: z.number(),
});

type RawItem = z.infer<typeof RawItemSchema>;

/** `T_AdvancedFuel1Icon` -> `AdvancedFuel1Icon` (the pixel-art files drop the `T_` prefix). */
function resolveIcon(assetPath: string, availableIcons: ReadonlySet<string>): string | null {
  const stem = assetStem(assetPath)?.replace(/^T_/, "") ?? null;
  return stem !== null && availableIcons.has(stem) ? stem : null;
}

function toItem(id: string, raw: RawItem, availableIcons: ReadonlySet<string>): Item {
  if (raw.EngineName !== id) {
    throw new Error(`Item "${id}": EngineName "${raw.EngineName}" differs from row key`);
  }
  const name = toLocalizedText(raw.DisplayName);
  if (!name) throw new Error(`Item "${id}": missing display name`);

  return ItemSchema.parse({
    id,
    name,
    description: toLocalizedText(raw.Description),
    tags: raw.Tags.map(parseEnumValue),
    weight: raw.Weight,
    sellValue: raw.SellValue,
    icon: resolveIcon(raw.Icon.AssetPathName, availableIcons),
    featureFlag: parseFeatureFlag(raw.FeatureFlag.TagName),
    isVirtual: parseEnumValue(raw.VirtualType) !== "NonVirtual",
  });
}

/** @param availableIcons file names (without extension) present in the icon set */
export function extractItems(
  rows: Record<string, unknown>,
  availableIcons: ReadonlySet<string>,
): Item[] {
  return Object.entries(rows)
    .map(([id, row]) => {
      const parsed = RawItemSchema.safeParse(row);
      if (!parsed.success) {
        throw new Error(`Item "${id}" has an unexpected shape\n${z.prettifyError(parsed.error)}`);
      }
      return toItem(id, parsed.data, availableIcons);
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}
