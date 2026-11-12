import type { ReactNode } from "react";

export interface NavItem {
  /** Locale-prefixed path, e.g. `/pt-BR/items`. */
  href: string;
  label: string;
  icon: ReactNode;
}
