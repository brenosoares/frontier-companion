import { Coins, Weight } from "lucide-react";
import type { Locale } from "@/shared/domain/localized-text";
import type { Messages } from "@/shared/i18n/messages/types";
import { formatNumber } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import type { Item } from "../domain/item";
import { visibleTags } from "../domain/item-list";
import { GameIcon } from "@/shared/ui/game-icon";

interface ItemHeaderProps {
  item: Item;
  locale: Locale;
  labels: Messages["items"];
}

/** Name, categories, description and key stats of one item. */
export function ItemHeader({ item, locale, labels }: ItemHeaderProps) {
  const tags = visibleTags(item.tags);
  const stats = [
    { label: labels.detail.sellValue, value: item.sellValue, icon: Coins },
    { label: labels.detail.weight, value: item.weight, icon: Weight },
  ];

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <GameIcon kind="item" icon={item.icon} size={64} className="size-20 border border-border" />
        <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
          {item.name[locale]}
        </h1>
      </div>

      {item.featureFlag !== null && (
        <p
          role="note"
          className="rounded-lg border border-tone-orange/40 bg-tone-orange/15 p-3 text-sm text-tone-orange"
        >
          <strong className="mr-1">{labels.unavailableBadge}.</strong>
          {labels.unavailableNote}
        </p>
      )}

      <p className="max-w-2xl text-lg text-muted">
        {item.description?.[locale] ?? labels.detail.noDescription}
      </p>

      {tags.length > 0 && (
        <section aria-label={labels.detail.categories}>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                <Badge>{labels.tags[tag as keyof typeof labels.tags] ?? tag}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <dl aria-label={labels.detail.stats} className="flex flex-wrap gap-x-8 gap-y-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon aria-hidden="true" className="size-5 text-muted" />
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="font-semibold">{formatNumber(value, locale)}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
