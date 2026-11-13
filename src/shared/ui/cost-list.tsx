import Link from "next/link";
import { formatNumber } from "@/shared/lib/format";
import { GameIcon } from "./game-icon";

export interface CostLine {
  itemId: string;
  name: string;
  amount: number;
  icon: string | null;
  /** Where the item's page is. */
  href: string;
}

/** What something costs: one tile per item, each linking to the item. */
export function CostList({ costs, locale }: { costs: readonly CostLine[]; locale: string }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {costs.map(({ itemId, name, amount, icon, href }) => (
        <li
          key={itemId}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
        >
          <GameIcon kind="item" icon={icon} size={32} className="size-10" />
          <p className="min-w-0 font-medium break-words">
            <span className="font-semibold">{formatNumber(amount, locale)}×</span>{" "}
            <Link
              href={href}
              className="rounded underline decoration-border-strong underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {name}
            </Link>
          </p>
        </li>
      ))}
    </ul>
  );
}
