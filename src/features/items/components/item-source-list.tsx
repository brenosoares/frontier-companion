import {
  Apple,
  Biohazard,
  Boxes,
  Coins,
  Dna,
  Gift,
  Ghost,
  PawPrint,
  Pickaxe,
  Recycle,
  Sprout,
  Store,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import type { Locale } from "@/shared/domain/localized-text";
import { localizedPath } from "@/shared/i18n/config";
import type { Messages } from "@/shared/i18n/messages/types";
import { formatNumber } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import type { ItemSource, ItemSourceKind } from "../domain/item-source";

const KIND_ICONS: Record<ItemSourceKind, ComponentType<{ className?: string }>> = {
  node: Pickaxe,
  plant: Sprout,
  "plant-fruit": Apple,
  "animal-product": PawPrint,
  "animal-droppings": Recycle,
  "critter-feed": Utensils,
  "large-item": Boxes,
  hazard: Biohazard,
  "loot-goblin": Ghost,
  mutation: Dna,
  merchant: Store,
  "care-package": Gift,
};

interface ItemSourceListProps {
  sources: readonly ItemSource[];
  locale: Locale;
  labels: Messages["items"]["sources"];
  /** Plants that have a page; only their sources link to it (scenery plants have none). */
  plantIds?: readonly string[];
}

/** "3×" or "3–5×" (en dash), localized. */
function formatAmount(minAmount: number, maxAmount: number, locale: Locale): string {
  const min = formatNumber(minAmount, locale);
  return minAmount === maxAmount ? `${min}×` : `${min}–${formatNumber(maxAmount, locale)}×`;
}

function formatChance(chance: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(
    chance / 100,
  );
}

/** Origins that have a page of their own: mutation seeds, large items, animals and plants. */
function sourceHref(
  source: ItemSource,
  locale: Locale,
  plantIds: ReadonlySet<string>,
): string | null {
  if ((source.kind === "plant" || source.kind === "plant-fruit") && plantIds.has(source.sourceId))
    return localizedPath(locale, `/plants/${source.sourceId}`);
  if (source.kind === "mutation" || source.kind === "large-item")
    return localizedPath(locale, `/items/${source.sourceId}`);
  if (source.kind.startsWith("animal-") || source.kind === "critter-feed")
    return localizedPath(locale, `/animals/${source.sourceId}`);
  return null;
}

const LINK_CLASS =
  "rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function ItemSourceList({ sources, locale, labels, plantIds = [] }: ItemSourceListProps) {
  const linkablePlants = new Set(plantIds);
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {sources.map((source) => {
        const Icon = KIND_ICONS[source.kind];
        const kindLabel = labels.kinds[source.kind];
        // Merchants and care packages have no name of their own: the kind says it all.
        const title = source.sourceName?.[locale] ?? kindLabel;
        const hasAmount = source.minAmount !== null && source.maxAmount !== null;

        return (
          <li
            key={source.id}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="font-medium break-words">
                {sourceHref(source, locale, linkablePlants) ? (
                  <Link href={sourceHref(source, locale, linkablePlants)!} className={LINK_CLASS}>
                    {title}
                  </Link>
                ) : (
                  title
                )}
              </span>
              {source.sourceName !== null && (
                <span className="text-sm text-muted">{kindLabel}</span>
              )}
              {(hasAmount || source.chance !== null || source.price !== null) && (
                <div className="flex flex-wrap gap-1.5 text-sm">
                  {hasAmount && (
                    <Badge>
                      <span className="sr-only">{labels.amount}: </span>
                      {formatAmount(source.minAmount!, source.maxAmount!, locale)}
                    </Badge>
                  )}
                  {source.chance !== null && (
                    <Badge>
                      <span className="sr-only">{labels.chance}: </span>
                      {formatChance(source.chance, locale)}
                    </Badge>
                  )}
                  {source.price !== null && (
                    <Badge>
                      <Coins aria-hidden="true" className="mr-1 size-3" />
                      <span className="sr-only">{labels.price}: </span>
                      {formatNumber(source.price, locale)}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
