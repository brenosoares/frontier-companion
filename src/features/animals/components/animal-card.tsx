import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import { GameIcon } from "@/shared/ui/game-icon";
import { ItemLine } from "@/shared/ui/item-line";

export interface AnimalCardData {
  href: string;
  name: string;
  icon: string | null;
  /** Localized diet name. */
  diet: string;
  /** What the animal gives, e.g. a feather. */
  product: { name: string; icon: string | null };
  /** Label above the product ("Product"). */
  productLabel: string;
}

/** One link per animal: icon, name, diet and what it gives. */
export function AnimalCard({ href, name, icon, diet, product, productLabel }: AnimalCardData) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-center gap-3">
        <GameIcon kind="animal" icon={icon} size={48} className="size-14" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-lg font-medium break-words">{name}</span>
          <Badge className="self-start">{diet}</Badge>
        </div>
      </div>
      <div className="mt-auto text-sm">
        <p className="text-muted">{productLabel}</p>
        <div className="mt-1">
          <ItemLine icon={product.icon} size={24}>
            {product.name}
          </ItemLine>
        </div>
      </div>
    </Link>
  );
}
