import type { MechPart } from "./mech";

/**
 * The rows of a side-by-side comparison of parts: every stat and every cost item any of them has,
 * in the order they first appear (so the common ones, like durability and slots, come first).
 */
export function comparisonRows(parts: readonly MechPart[]): {
  statIds: string[];
  costItemIds: string[];
} {
  const firstSeen = (ids: Iterable<string>) => [...new Set(ids)];
  return {
    statIds: firstSeen(parts.flatMap((part) => part.stats.map(({ stat }) => stat))),
    costItemIds: firstSeen(parts.flatMap((part) => part.costs.map(({ itemId }) => itemId))),
  };
}

/** The value a part has for a stat, or null when it does not have that stat. */
export function statValue(part: MechPart, statId: string): number | null {
  return part.stats.find(({ stat }) => stat === statId)?.value ?? null;
}

/** How many of an item a part costs, or null when it does not cost it. */
export function costAmount(part: MechPart, itemId: string): number | null {
  return part.costs.find((cost) => cost.itemId === itemId)?.amount ?? null;
}
