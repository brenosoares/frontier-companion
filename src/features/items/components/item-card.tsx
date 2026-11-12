import { Coins, Weight } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import type { ItemListEntry } from "../domain/item-list";
import { ItemIcon } from "./item-icon";

const MAX_VISIBLE_TAGS = 3;

export interface ItemCardLabels {
  tags: Readonly<Record<string, string>>;
  sellValue: string;
  weight: string;
  unavailable: string;
}

interface ItemCardProps {
  entry: ItemListEntry;
  href: string;
  locale: string;
  labels: ItemCardLabels;
}

export function ItemCard({ entry, href, locale, labels }: ItemCardProps) {
  const tags = entry.tags.slice(0, MAX_VISIBLE_TAGS);

  return (
    <Link
      href={href}
      className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-start gap-3">
        <ItemIcon icon={entry.icon} size={40} className="size-12" />
        <span className="min-w-0 font-medium break-words">{entry.name}</span>
      </div>

      {(tags.length > 0 || entry.unavailable) && (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag}>
              <Badge>{labels.tags[tag] ?? tag}</Badge>
            </li>
          ))}
          {entry.unavailable && (
            <li>
              <Badge tone="orange">{labels.unavailable}</Badge>
            </li>
          )}
        </ul>
      )}

      <dl className="mt-auto flex gap-4 text-sm text-muted">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{labels.sellValue}</dt>
          <Coins aria-hidden="true" className="size-4" />
          <dd>{formatNumber(entry.sellValue, locale)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{labels.weight}</dt>
          <Weight aria-hidden="true" className="size-4" />
          <dd>{formatNumber(entry.weight, locale)}</dd>
        </div>
      </dl>
    </Link>
  );
}
