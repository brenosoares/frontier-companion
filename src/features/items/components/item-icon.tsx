import { Package } from "lucide-react";
import Image from "next/image";
import { cn } from "@/shared/lib/cn";

interface ItemIconProps {
  /** Icon file name (no extension) from the dataset; null renders a generic placeholder. */
  icon: string | null;
  /** Pixel size of the image inside the tile. */
  size: number;
  className?: string;
}

/**
 * Decorative item icon: the item's name is always shown next to it, so it has no alt text.
 * Pixel art is scaled with nearest-neighbour to stay crisp, and served as-is (no optimizer).
 */
export function ItemIcon({ icon, size, className }: ItemIconProps) {
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
          src={`/icons/items/${icon}.png`}
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
