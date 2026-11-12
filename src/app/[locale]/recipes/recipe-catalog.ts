import { CONSTRUCT_CATEGORIES, constructGroup } from "@/features/constructs/domain/construct";
import { groupCraftedByFamily } from "@/features/recipes/domain/crafted-by-family";
import { buildVariantIndex } from "@/features/recipes/domain/crafting-plan";
import { LOCALES, type Locale } from "@/shared/domain/localized-text";
import { localizedPath } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { normalizeText } from "@/shared/lib/text";
import type { CraftCardEntry } from "@/shared/ui/craft-card";
import {
  constructRepository,
  itemRepository,
  itemSourceRepository,
  recipeRepository,
  stationRepository,
} from "../data";

export type CategoryGroup = "constructs" | "decorations" | "craft";

export interface CategorySummary {
  id: string;
  group: CategoryGroup;
  label: string;
  /** Everything in the category, including content gated by feature flags. */
  total: number;
  /** What is shown by default (not gated). */
  available: number;
}

export interface RecipeCatalog {
  /** In display order: constructs, decorations, then crafting families. */
  categories: readonly CategorySummary[];
  /** Cards of each category, sorted by name. */
  entries: ReadonlyMap<string, readonly CraftCardEntry[]>;
}

const CRAFT_PREFIX = "craft-";

const cache = new Map<Locale, Promise<RecipeCatalog>>();

/**
 * Builds every category and card from the repositories, once per locale. This is the only place
 * that joins constructs, items, recipes and stations; the UI receives plain card data.
 */
export function loadRecipeCatalog(locale: Locale): Promise<RecipeCatalog> {
  let catalog = cache.get(locale);
  if (!catalog) {
    catalog = buildCatalog(locale);
    cache.set(locale, catalog);
  }
  return catalog;
}

async function buildCatalog(locale: Locale): Promise<RecipeCatalog> {
  const { recipesHub } = getMessages(locale);
  const [items, recipes, stations, constructs, sourcedIds] = await Promise.all([
    itemRepository.getAll(),
    recipeRepository.getAll(),
    stationRepository.getAll(),
    constructRepository.getAll(),
    itemSourceRepository.getSourcedItemIds(),
  ]);

  const itemById = new Map(items.map((item) => [item.id, item]));
  const stationById = new Map(stations.map((station) => [station.id, station]));
  const itemName = (id: string, l: Locale = locale) => itemById.get(id)?.name[l] ?? id;
  const costLines = (costs: readonly { itemId: string; amount: number }[]) =>
    costs.map(({ itemId, amount }) => ({ name: itemName(itemId), amount }));
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

  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const byName = (a: CraftCardEntry, b: CraftCardEntry) => collator.compare(a.name, b.name);

  const categories: CategorySummary[] = [];
  const entries = new Map<string, CraftCardEntry[]>();
  const add = (id: string, group: CategoryGroup, label: string, cards: CraftCardEntry[]) => {
    if (cards.length === 0) return;
    entries.set(id, cards.sort(byName));
    categories.push({
      id,
      group,
      label,
      total: cards.length,
      available: cards.filter((card) => !card.unavailable).length,
    });
  };

  for (const category of CONSTRUCT_CATEGORIES) {
    add(
      category,
      constructGroup(category),
      recipesHub.categories[category],
      constructs
        .filter((construct) => construct.category === category)
        .map((construct) => ({
          id: construct.id,
          href: localizedPath(locale, `/recipes/constructs/${construct.id}`),
          name: construct.name[locale],
          icon: construct.icon,
          iconKind: "construct",
          costs: costLines(construct.costs),
          madeIn: [recipesHub.cards.buildMode],
          unavailable: construct.featureFlag !== null,
          searchText: searchText(
            [construct.name],
            construct.costs.map((cost) => cost.itemId),
          ),
        })),
    );
  }

  const variants = buildVariantIndex(recipes);
  const isObtainable = (id: string) => variants.has(id) || sourcedIds.has(id);
  const craftCategories: [string, string, CraftCardEntry[]][] = [];
  for (const [family, crafted] of groupCraftedByFamily(recipes, stations, isObtainable)) {
    const label = stationById.get(family)?.name[locale] ?? family;
    const cards = crafted.map((entry): CraftCardEntry => {
      const item = itemById.get(entry.itemId);
      return {
        id: entry.itemId,
        href: localizedPath(locale, `/items/${entry.itemId}`),
        name: itemName(entry.itemId),
        icon: item?.icon ?? null,
        iconKind: "item",
        costs: costLines(entry.costs),
        yields: entry.yields,
        // Tiers read in order ("Furnace", "Furnace II", "Furnace III"), whatever their ids look like.
        madeIn: entry.stationIds
          .map((id) => stationById.get(id)?.name[locale] ?? id)
          .sort(collator.compare),
        unavailable: (item?.featureFlag ?? null) !== null,
        searchText: searchText(
          item ? [item.name] : [],
          entry.costs.map((cost) => cost.itemId),
        ),
      };
    });
    craftCategories.push([family, label, cards]);
  }
  craftCategories
    .sort(([, a], [, b]) => collator.compare(a, b))
    .forEach(([family, label, cards]) => add(`${CRAFT_PREFIX}${family}`, "craft", label, cards));

  return { categories, entries };
}
