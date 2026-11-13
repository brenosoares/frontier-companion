import {
  GENERAL_CHIPS,
  type MechChip,
  type MechPart,
  PART_CATEGORIES,
  type PartCategory,
  partGroup,
} from "@/features/mech/domain/mech";
import { formatStatValue } from "@/features/mech/domain/format-stat";
import { LOCALES, type Locale } from "@/shared/domain/localized-text";
import { localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { formatNumber, formatTemplate } from "@/shared/lib/format";
import { normalizeText } from "@/shared/lib/text";
import type { CraftCardEntry } from "@/shared/ui/craft-card";
import { itemRepository, mechRepository } from "../data";

export type MechGroup = "body" | "tools" | "transform" | "chips";

export interface MechCategorySummary {
  /** A part category (`spike-saw`), `chips-<part category>` or `chips-general`. */
  id: string;
  group: MechGroup;
  label: string;
  total: number;
  available: number;
}

export interface MechCatalog {
  categories: readonly MechCategorySummary[];
  /** Cards of each category, in the order they are shown. */
  entries: ReadonlyMap<string, readonly CraftCardEntry[]>;
}

const CHIPS_PREFIX = "chips-";

export const chipCategoryId = (category: PartCategory | typeof GENERAL_CHIPS) =>
  `${CHIPS_PREFIX}${category}`;

const cache = new Map<Locale, Promise<MechCatalog>>();

/** Builds every mech category and card once per locale: the only place that joins parts, chips and items. */
export function loadMechCatalog(locale: Locale): Promise<MechCatalog> {
  let catalog = cache.get(locale);
  if (!catalog) {
    catalog = buildCatalog(locale);
    cache.set(locale, catalog);
  }
  return catalog;
}

async function buildCatalog(locale: Locale): Promise<MechCatalog> {
  const { mech: text } = getMessages(locale);
  const [items, stats, parts, chips] = await Promise.all([
    itemRepository.getAll(),
    mechRepository.getStats(),
    mechRepository.getParts(),
    mechRepository.getChips(),
  ]);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const statById = new Map(stats.map((stat) => [stat.id, stat]));
  const itemName = (id: string, l: Locale = locale) => itemById.get(id)?.name[l] ?? id;

  const costLines = (costs: readonly { itemId: string; amount: number }[]) =>
    costs.map(({ itemId, amount }) => ({
      name: itemName(itemId),
      amount,
      icon: itemById.get(itemId)?.icon ?? null,
    }));
  const searchText = (
    names: readonly { en: string; "pt-BR": string }[],
    itemIds: readonly string[],
  ) =>
    normalizeText(
      [
        ...names.flatMap((n) => LOCALES.map((l) => n[l])),
        ...itemIds.flatMap((id) => LOCALES.map((l) => itemName(id, l))),
      ].join(" "),
    );

  const partCard = (part: MechPart): CraftCardEntry => ({
    id: part.id,
    href: localizedPath(locale, `/mech/${part.id}`),
    name: part.name[locale],
    icon: part.icon,
    iconKind: "mech",
    detailsFirst: true,
    costs: costLines(part.costs),
    madeIn: part.stats.flatMap(({ stat, value }) => {
      const known = statById.get(stat);
      return known
        ? [`${known.name[locale]}: ${formatStatValue(known.kind, value, locale, text.yes)}`]
        : [];
    }),
    unavailable: part.featureFlag !== null,
    searchText: searchText(
      [part.name],
      part.costs.map((cost) => cost.itemId),
    ),
  });

  const chipCard = (chip: MechChip): CraftCardEntry => ({
    id: chip.id,
    href: localizedPath(locale, `/mech/chip/${chip.id}`),
    name: chip.name[locale],
    icon: chip.icon,
    iconKind: "mech",
    detailsFirst: true,
    costs: costLines(chip.costs),
    madeIn: [
      formatTemplate(text.cards.power, { count: formatNumber(chip.powerCost, locale) }),
      ...(chip.unique ? [text.cards.unique] : []),
    ],
    unavailable: chip.featureFlag !== null,
    searchText: searchText(
      [chip.name],
      chip.costs.map((cost) => cost.itemId),
    ),
  });

  const categories: MechCategorySummary[] = [];
  const entries = new Map<string, CraftCardEntry[]>();
  const add = (id: string, group: MechGroup, label: string, cards: CraftCardEntry[]) => {
    if (cards.length === 0) return;
    entries.set(id, cards);
    categories.push({
      id,
      group,
      label,
      total: cards.length,
      available: cards.filter((card) => !card.unavailable).length,
    });
  };

  for (const category of PART_CATEGORIES) {
    add(
      category,
      partGroup(category),
      text.categories[category],
      parts.filter((part) => part.category === category).map(partCard),
    );
  }

  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const byName = (a: CraftCardEntry, b: CraftCardEntry) => collator.compare(a.name, b.name);
  for (const category of PART_CATEGORIES) {
    add(
      chipCategoryId(category),
      "chips",
      formatTemplate(text.chipsOf, { part: text.categories[category] }),
      chips
        .filter((chip) => chip.fits.includes(category))
        .map(chipCard)
        .sort(byName),
    );
  }
  add(
    chipCategoryId(GENERAL_CHIPS),
    "chips",
    text.chipsGeneral,
    chips
      .filter((chip) => chip.fits.length === 0)
      .map(chipCard)
      .sort(byName),
  );

  return { categories, entries };
}
