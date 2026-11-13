import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import { GameIcon } from "@/shared/ui/game-icon";
import { ItemLine } from "@/shared/ui/item-line";

export interface PlantCardData {
  href: string;
  name: string;
  icon: string | null;
  /** Localized nutrient type; null for plants that have none. */
  type: string | null;
  /** "Matures in 3 days". */
  mature: string;
  /** The seed item, when the data names one. */
  seed: { name: string; icon: string | null } | null;
  /** Label above the seed ("Seed"). */
  seedLabel: string;
}

/** One link per plant: icon, name, nutrient type, time to mature and its seed. */
export function PlantCard({ href, name, icon, type, mature, seed, seedLabel }: PlantCardData) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-center gap-3">
        <GameIcon kind="plant" icon={icon} size={48} className="size-14" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-lg font-medium break-words">{name}</span>
          {type && <Badge className="self-start">{type}</Badge>}
        </div>
      </div>
      <p className="text-sm text-muted">{mature}</p>
      {seed && (
        <div className="mt-auto text-sm">
          <p className="text-muted">{seedLabel}</p>
          <div className="mt-1">
            <ItemLine icon={seed.icon} size={24}>
              {seed.name}
            </ItemLine>
          </div>
        </div>
      )}
    </Link>
  );
}
