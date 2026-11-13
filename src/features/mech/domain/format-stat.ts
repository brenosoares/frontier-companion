import type { MechStat } from "./mech";

/**
 * A stat value the way the game shows it: fractions as percentages (0.25 -> 25%), unlocks as a
 * word, everything else as a number.
 */
export function formatStatValue(
  kind: MechStat["kind"],
  value: number,
  locale: string,
  unlockedLabel: string,
): string {
  if (kind === "unlock") return unlockedLabel;
  if (kind === "percent") {
    return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(
      value,
    );
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}
