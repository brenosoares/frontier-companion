import { Egg, PawPrint, Pickaxe, Recycle, Sprout } from "lucide-react";
import type { ComponentType } from "react";
import type { Locale } from "@/shared/domain/localized-text";
import type { Messages } from "@/shared/i18n/messages/types";
import { formatNumber } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import type { ItemSource, ItemSourceKind } from "../domain/item-source";

const KIND_ICONS: Record<ItemSourceKind, ComponentType<{ className?: string }>> = {
  node: Pickaxe,
  plant: Sprout,
  "animal-product": PawPrint,
  "animal-droppings": Recycle,
  "animal-egg": Egg,
};

interface ItemSourceListProps {
  sources: readonly ItemSource[];
  locale: Locale;
  labels: Messages["items"]["sources"];
}

/** "3" or "3–5" (en dash), localized. */
function formatAmount({ minAmount, maxAmount }: ItemSource, locale: Locale): string {
  const min = formatNumber(minAmount, locale);
  return minAmount === maxAmount ? `${min}×` : `${min}–${formatNumber(maxAmount, locale)}×`;
}

function formatChance(chance: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(
    chance / 100,
  );
}

export function ItemSourceList({ sources, locale, labels }: ItemSourceListProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {sources.map((source) => {
        const Icon = KIND_ICONS[source.kind];
        return (
          <li
            key={source.id}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="font-medium break-words">{source.sourceName[locale]}</span>
              <span className="text-sm text-muted">{labels.kinds[source.kind]}</span>
              <div className="flex flex-wrap gap-1.5 text-sm">
                <Badge>
                  <span className="sr-only">{labels.amount}: </span>
                  {formatAmount(source, locale)}
                </Badge>
                <Badge>
                  <span className="sr-only">{labels.chance}: </span>
                  {formatChance(source.chance, locale)}
                </Badge>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
