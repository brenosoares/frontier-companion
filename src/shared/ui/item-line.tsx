import type { ReactNode } from "react";
import { GameIcon } from "./game-icon";

/** Image size (px) -> the Tailwind class of the tile around it. */
const TILE_CLASS = { 24: "size-8", 28: "size-9", 32: "size-10" } as const;

interface ItemLineProps {
  /** Icon file name from the dataset; null shows the generic glyph. */
  icon: string | null;
  size?: keyof typeof TILE_CLASS;
  /** The text next to the icon, usually "3× Copper Ore" (plain or as a link). */
  children: ReactNode;
}

/** An item reference with its icon, the same look wherever a recipe or cost lists ingredients. */
export function ItemLine({ icon, size = 28, children }: ItemLineProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <GameIcon kind="item" icon={icon} size={size} className={TILE_CLASS[size]} />
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}
