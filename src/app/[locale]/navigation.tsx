import { Calculator, Home, Package, ScrollText } from "lucide-react";
import { type Locale, localizedPath } from "@/shared/i18n/config";
import type { Messages } from "@/shared/i18n/messages/types";
import type { NavItem } from "@/shared/layout/nav-item";

/** Single place that declares the sidebar. New features add their entry here. */
export function buildNavItems(locale: Locale, messages: Messages): NavItem[] {
  return [
    {
      href: localizedPath(locale, "/"),
      label: messages.nav.home,
      icon: <Home className="size-5" />,
    },
    {
      href: localizedPath(locale, "/items"),
      label: messages.nav.items,
      icon: <Package className="size-5" />,
    },
    {
      href: localizedPath(locale, "/recipes"),
      label: messages.nav.recipes,
      icon: <ScrollText className="size-5" />,
    },
    {
      href: localizedPath(locale, "/calculator"),
      label: messages.nav.calculator,
      icon: <Calculator className="size-5" />,
    },
  ];
}
