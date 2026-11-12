import Link from "next/link";
import { formatNumber, formatTemplate } from "@/shared/lib/format";
import { Badge } from "./badge";
import { GameIcon, type GameIconKind } from "./game-icon";

/** A buildable or craftable thing, ready to show. Plain data: it also crosses to client components. */
export interface CraftCardEntry {
  id: string;
  href: string;
  name: string;
  icon: string | null;
  iconKind: GameIconKind;
  /** What it costs, e.g. `{ name: "Wood", amount: 15 }`. */
  costs: { name: string; amount: number }[];
  /** Units one craft yields; shown only when above 1. */
  yields?: number;
  /** Where it is made: station names, or "Build mode". */
  madeIn: string[];
  /** Gated by a feature flag that may not be live. */
  unavailable: boolean;
  /** Accent-insensitive text matched by the filter (names in every language). */
  searchText: string;
}

export interface CraftCardLabels {
  cost: string;
  madeIn: string;
  /** Template with `{count}`, e.g. "Yields {count}×". */
  yields: string;
  unavailable: string;
}

interface CraftCardProps {
  entry: CraftCardEntry;
  locale: string;
  labels: CraftCardLabels;
}

export function CraftCard({ entry, locale, labels }: CraftCardProps) {
  return (
    <Link
      href={entry.href}
      className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-start gap-3">
        <GameIcon kind={entry.iconKind} icon={entry.icon} size={40} className="size-12" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="font-medium break-words">{entry.name}</span>
          {entry.yields !== undefined && entry.yields > 1 && (
            <span className="text-sm text-muted">
              {formatTemplate(labels.yields, { count: formatNumber(entry.yields, locale) })}
            </span>
          )}
          {entry.unavailable && (
            <Badge tone="orange" className="self-start">
              {labels.unavailable}
            </Badge>
          )}
        </div>
      </div>

      {entry.costs.length > 0 && (
        <div className="text-sm">
          <p className="text-muted">{labels.cost}</p>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {entry.costs.map((cost) => (
              <li key={cost.name}>
                <span className="font-semibold">{formatNumber(cost.amount, locale)}×</span>{" "}
                {cost.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {entry.madeIn.length > 0 && (
        <div className="mt-auto flex flex-wrap items-center gap-1.5 text-sm text-muted">
          <span>{labels.madeIn}:</span>
          {entry.madeIn.map((place) => (
            <Badge key={place}>{place}</Badge>
          ))}
        </div>
      )}
    </Link>
  );
}
