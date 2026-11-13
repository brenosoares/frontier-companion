import { z } from "zod";
import {
  type MechChip,
  MechChipSchema,
  type MechPart,
  MechPartSchema,
  type MechStat,
  MechStatSchema,
  PART_CATEGORIES,
  type PartCategory,
  STAT_KINDS,
} from "@/features/mech/domain/mech";
import type { LocalizedText } from "@/shared/domain/localized-text";
import { isUnfinished } from "../quality/unfinished";
import { resolveIcon } from "../unreal/icons";
import { RawTextSchema, toLocalizedText, toPlainText } from "../unreal/localized";
import { normalizeKeys, parseEnumValue, resolveFeatureFlag } from "../unreal/normalize";

export interface MechOptions {
  availableIcons: ReadonlySet<string>;
  releasedFlags: ReadonlySet<string>;
}

function parse<T>(schema: z.ZodType<T>, row: unknown, label: string): T {
  const parsed = schema.safeParse(normalizeKeys(row));
  if (!parsed.success) {
    throw new Error(`${label} has an unexpected shape\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

const STAT_PREFIX = "Upgrade.";
const statId = (tag: string) => (tag.startsWith(STAT_PREFIX) ? tag.slice(STAT_PREFIX.length) : tag);

// ---------------------------------------------------------------------------- stats

const RawStatDisplaySchema = z.object({ DisplayName: RawTextSchema, Format: z.string() });

/**
 * The game formats each stat with an enum we only see as `NewEnumeratorN`. What each one means is
 * inferred from the stats that use it (ADR 0014): 3, 4 and 9 hold fractions (0.25 = +25%), 6 is an
 * on/off unlock, the rest plain numbers. An enumerator not listed here fails the build.
 */
const STAT_FORMAT: Readonly<Record<string, (typeof STAT_KINDS)[number]>> = {
  NewEnumerator0: "number",
  NewEnumerator1: "number",
  NewEnumerator2: "number",
  NewEnumerator3: "percent",
  NewEnumerator4: "percent",
  NewEnumerator5: "number",
  NewEnumerator6: "unlock",
  NewEnumerator7: "number",
  NewEnumerator9: "percent",
  NewEnumerator10: "number",
};

/**
 * `DT_StatDisplay`: the game's own name for each stat. Rows keyed `Stat|Chips.Family` only change a
 * stat's baseline for one family, so they are skipped.
 */
export function extractMechStats(rows: Record<string, unknown>): MechStat[] {
  return Object.entries(rows)
    .filter(([key]) => !key.includes("|"))
    .map(([key, row]) => {
      const raw = parse(RawStatDisplaySchema, row, `Stat "${key}"`);
      const name = toLocalizedText(raw.DisplayName);
      if (!name) throw new Error(`Stat "${key}" has no display name`);
      const format = parseEnumValue(raw.Format);
      const kind = STAT_FORMAT[format];
      if (!kind) throw new Error(`Stat "${key}" uses unknown format "${format}"`);
      return MechStatSchema.parse({ id: statId(key), name, kind });
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------------------- parts

const RawModuleSchema = z.object({
  DisplayName: RawTextSchema,
  Description: RawTextSchema,
  Type: z.string(),
  ChipFamily: z.object({ TagName: z.string() }),
  Stats: z.array(z.object({ Tag: z.object({ TagName: z.string() }), Value: z.number() })),
  ItemCost: z.array(z.object({ Name: z.string(), Amount: z.number() })),
  Set: z.string().optional(),
  Icon: z.object({ AssetPathName: z.string() }),
  NextUpgrade: z.string(),
  PairedRow: z.string(),
  FeatureFlag: z.object({ TagName: z.string() }).optional(),
});

type RawModule = z.infer<typeof RawModuleSchema>;

/** Tool and transform-mode modules name their category in the chip family they accept. */
const FAMILY_CATEGORY: Readonly<Record<string, PartCategory>> = {
  "Chips.Tool.SpikeSaw": "spike-saw",
  "Chips.Tool.IrrigationHose": "irrigation-hose",
  "Chips.Tool.ResourceVacuum": "resource-vacuum",
  "Chips.Tool.SeedShooter": "seed-shooter",
  "Chips.Tool.SproutCannon": "sprout-cannon",
  "Chips.TransformMode.Tractor.Plow": "plow",
  "Chips.TransformMode.Tractor.Harvester": "harvester",
  "Chips.TransformMode.Tractor.FertilizerSpreader": "fertilizer-spreader",
  "Chips.TransformMode.Trailblazer": "trailblazer",
  "Chips.TransformMode.Tractor.Pathmaker": "landscaper",
  "Chips.TransformMode.Flight": "skyblazer",
};

interface Entry {
  /** Module row this entry is built from (the one that holds the cost). */
  key: string;
  id: string;
  category: PartCategory;
  raw: RawModule;
  /** Where name, description and icon come from (the set row for arms and legs). */
  presentation: RawModule;
}

function categoryOf(key: string, raw: RawModule, type: string): PartCategory | null {
  if (type === "Engine") return "engine";
  if (type === "Windshield") return "windshield";
  if (type === "RightArm") return "arms";
  if (type === "RightLeg") return "legs";
  if (type === "Tool" || type === "TransformMode") {
    const category = FAMILY_CATEGORY[raw.ChipFamily.TagName];
    if (!category)
      throw new Error(`Module "${key}": unknown chip family "${raw.ChipFamily.TagName}"`);
    return category;
  }
  return null;
}

const healthOf = (raw: RawModule) =>
  raw.Stats.find(({ Tag }) => Tag.TagName === `${STAT_PREFIX}Health.Max`)?.Value;

/**
 * Arms and legs come as a left and a right piece. Both have the same durability, but only the right
 * one lists a cost, mod slots and hauling capacity. The pair is one entry, taken from the right
 * piece and named by its "Set" row.
 */
function buildEntries(modules: ReadonlyMap<string, RawModule>): Entry[] {
  const entries: Entry[] = [];
  for (const [key, raw] of modules) {
    if (raw.Stats.length === 0) continue; // cosmetic skins and set selectors
    const category = categoryOf(key, raw, parseEnumValue(raw.Type));
    if (!category) continue;

    if (category === "arms" || category === "legs") {
      const setType = category === "arms" ? "ArmSet" : "LegSet";
      const set = [...modules.entries()].find(
        ([, candidate]) => parseEnumValue(candidate.Type) === setType && candidate.Set === raw.Set,
      );
      if (!set) throw new Error(`Module "${key}": no ${setType} row for set "${raw.Set}"`);
      const left = modules.get(raw.PairedRow);
      if (!left || healthOf(left) !== healthOf(raw)) {
        throw new Error(`Module "${key}": its paired piece has a different durability`);
      }
      entries.push({ key, id: set[0], category, raw, presentation: set[1] });
    } else {
      entries.push({ key, id: key, category, raw, presentation: raw });
    }
  }
  return entries;
}

/** Orders the entries of one category along `NextUpgrade`, from the one nothing leads to. */
function chainOrder(category: PartCategory, entries: readonly Entry[]): Entry[] {
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  const pointedAt = new Set(entries.map((entry) => entry.raw.NextUpgrade));
  const heads = entries.filter((entry) => !pointedAt.has(entry.key));
  if (heads.length !== 1) throw new Error(`Category "${category}": expected one first tier`);

  const ordered: Entry[] = [];
  for (let current = heads[0]; current; current = byKey.get(current.raw.NextUpgrade)) {
    if (ordered.includes(current)) throw new Error(`Category "${category}": broken tier chain`);
    ordered.push(current);
  }
  if (ordered.length !== entries.length)
    throw new Error(`Category "${category}": broken tier chain`);
  return ordered;
}

const MK_SUFFIX = /(Mk\.\s*)(\S+)$/;

/** The last tier of each line is named `Mk. ⎒`, a glyph we cannot render: it reads as the next number. */
function numberLastMk(
  name: LocalizedText,
  previous: LocalizedText | undefined,
  id: string,
): LocalizedText {
  const fix = (value: string, before: string | undefined) => {
    const match = MK_SUFFIX.exec(value);
    if (!match || /^\d+$/.test(match[2]!)) return value;
    const prior = before ? MK_SUFFIX.exec(before)?.[2] : undefined;
    if (!prior || !/^\d+$/.test(prior)) throw new Error(`Part "${id}": cannot number "${value}"`);
    return value.replace(MK_SUFFIX, `${match[1]}${Number(prior) + 1}`);
  };
  return { en: fix(name.en, previous?.en), "pt-BR": fix(name["pt-BR"], previous?.["pt-BR"]) };
}

/**
 * Mech parts (`DT_Modules`): body (engine, windshield, arms, legs), tools and transform modes, one
 * entry per tier, in upgrade order. Skins (no stats, no cost) are not parts and are left out.
 */
export function extractMechParts(
  rows: Record<string, unknown>,
  stats: readonly MechStat[],
  options: MechOptions,
): { parts: MechPart[]; warnings: string[] } {
  const statIds = new Set(stats.map((stat) => stat.id));
  const warnings: string[] = [];
  const modules = new Map<string, RawModule>();
  for (const [key, row] of Object.entries(rows)) {
    const raw = parse(RawModuleSchema, row, `Module "${key}"`);
    const name = toLocalizedText(raw.DisplayName);
    if (name && isUnfinished(name.en)) {
      warnings.push(`Dropped mech module "${key}": unfinished or obsolete content`);
      continue;
    }
    modules.set(key, raw);
  }

  const entries = buildEntries(modules);
  const parts = PART_CATEGORIES.flatMap((category) => {
    const inCategory = entries.filter((entry) => entry.category === category);
    if (inCategory.length === 0) return [];
    const ordered = chainOrder(category, inCategory);

    return ordered.map((entry, index): MechPart => {
      const name = toLocalizedText(entry.presentation.DisplayName);
      if (!name) throw new Error(`Module "${entry.key}": missing display name`);
      const previous = ordered[index - 1]?.presentation.DisplayName;
      return MechPartSchema.parse({
        id: entry.id,
        name: numberLastMk(
          name,
          previous ? (toLocalizedText(previous) ?? undefined) : undefined,
          entry.id,
        ),
        description: toPlainText(toLocalizedText(entry.presentation.Description)),
        icon: resolveIcon(entry.presentation.Icon.AssetPathName, options.availableIcons),
        category,
        tier: index + 1,
        costs: entry.raw.ItemCost.map(({ Name, Amount }) => ({ itemId: Name, amount: Amount })),
        stats: entry.raw.Stats.map(({ Tag, Value }) => {
          const id = statId(Tag.TagName);
          if (!statIds.has(id)) throw new Error(`Module "${entry.key}": unknown stat "${id}"`);
          return { stat: id, value: Value };
        }),
        featureFlag: resolveFeatureFlag(
          entry.raw.FeatureFlag?.TagName ?? "None",
          options.releasedFlags,
        ),
      });
    });
  });
  return { parts, warnings };
}

// ---------------------------------------------------------------------------- chips

const RawChipSchema = z.object({
  DisplayName: RawTextSchema,
  Description: RawTextSchema,
  PowerCost: z.number(),
  Tags: z.array(z.string()),
  ItemCost: z.array(z.object({ Name: z.string(), Amount: z.number() })),
  Icon: z.object({ AssetPathName: z.string() }),
  FeatureFlag: z.object({ TagName: z.string() }),
});

const TOOLS: readonly PartCategory[] = [
  "spike-saw",
  "irrigation-hose",
  "resource-vacuum",
  "seed-shooter",
  "sprout-cannon",
];
const TRACTORS: readonly PartCategory[] = ["plow", "harvester", "fertilizer-spreader"];

/** A chip's tag -> the part categories it fits. `Chips.Unique` is a mark, not a part. */
const TAG_FITS: Readonly<Record<string, readonly PartCategory[]>> = {
  "Chips.Mech.Engine": ["engine"],
  "Chips.Mech.Arms": ["arms"],
  "Chips.Mech.Legs": ["legs"],
  "Chips.Tool": TOOLS,
  "Chips.Tool.SpikeSaw": ["spike-saw"],
  "Chips.Tool.IrrigationHose": ["irrigation-hose"],
  "Chips.Tool.ResourceVacuum": ["resource-vacuum"],
  "Chips.Tool.SeedShooter": ["seed-shooter"],
  "Chips.Tool.SproutCannon": ["sprout-cannon"],
  "Chips.TransformMode.Tractor": TRACTORS,
  "Chips.TransformMode.Tractor.Plow": ["plow"],
  "Chips.TransformMode.Tractor.Harvester": ["harvester"],
  "Chips.TransformMode.Tractor.FertilizerSpreader": ["fertilizer-spreader"],
  "Chips.TransformMode.Trailblazer": ["trailblazer"],
  "Chips.TransformMode.Flight": ["skyblazer"],
  "Chips.Unique": [],
};

/**
 * Chips (`DT_CoreUpgrades`): upgrades installed in a part's mod slots. The game's description says
 * what each does (percentages included), so the raw stat numbers are not repeated.
 */
export function extractMechChips(
  rows: Record<string, unknown>,
  options: MechOptions,
): { chips: MechChip[]; warnings: string[] } {
  const warnings: string[] = [];
  const chips: MechChip[] = [];
  for (const [id, row] of Object.entries(rows)) {
    const raw = parse(RawChipSchema, row, `Chip "${id}"`);
    const name = toLocalizedText(raw.DisplayName);
    if (!name) throw new Error(`Chip "${id}": missing display name`);
    if (isUnfinished(name.en)) {
      warnings.push(`Dropped chip "${id}": unfinished or obsolete content`);
      continue;
    }
    const fits = new Set<PartCategory>();
    for (const tag of raw.Tags) {
      const categories = TAG_FITS[tag];
      if (!categories) throw new Error(`Chip "${id}": unknown tag "${tag}"`);
      categories.forEach((category) => fits.add(category));
    }
    chips.push(
      MechChipSchema.parse({
        id,
        name,
        description: toPlainText(toLocalizedText(raw.Description)),
        icon: resolveIcon(raw.Icon.AssetPathName, options.availableIcons),
        powerCost: raw.PowerCost,
        costs: raw.ItemCost.map(({ Name, Amount }) => ({ itemId: Name, amount: Amount })),
        fits: PART_CATEGORIES.filter((category) => fits.has(category)),
        unique: raw.Tags.includes("Chips.Unique"),
        featureFlag: resolveFeatureFlag(raw.FeatureFlag.TagName, options.releasedFlags),
      }),
    );
  }
  return { chips: chips.sort((a, b) => a.id.localeCompare(b.id)), warnings };
}
