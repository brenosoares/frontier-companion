import { Package } from "lucide-react";
import Image from "next/image";
import { cn } from "@/shared/lib/cn";

/** Where each kind of icon is published (`pnpm data:build`). */
const ICON_DIRECTORIES = {
  item: "/icons/items",
  construct: "/icons/constructs",
  animal: "/icons/animals",
  mech: "/icons/mech",
} as const;

export type GameIconKind = keyof typeof ICON_DIRECTORIES;

interface GameIconProps {
  kind: GameIconKind;
  /** Icon file name (no extension) from the dataset; null renders a generic placeholder. */
  icon: string | null;
  /** Pixel size of the image inside the tile. */
  size: number;
  className?: string;
}

/**
 * Decorative icon of an item or construct: the item's name is always shown next to it, so it has no alt text.
 * Pixel art is scaled with nearest-neighbour to stay crisp, and served as-is (no optimizer).
 */
export function GameIcon({ kind, icon, size, className }: GameIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-icon-tile text-muted",
        className,
      )}
    >
      {icon ? (
        <Image
          src={`${ICON_DIRECTORIES[kind]}/${icon}.png`}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="[image-rendering:pixelated]"
        />
      ) : (
        <Package style={{ width: size / 2, height: size / 2 }} />
      )}
    </span>
  );
}
