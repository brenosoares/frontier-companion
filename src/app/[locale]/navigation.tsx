import {
  Calculator,
  Hammer,
  Home,
  Package,
  PawPrint,
  ScrollText,
  Sprout,
  Wrench,
} from "lucide-react";
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
      href: localizedPath(locale, "/constructs"),
      label: messages.nav.constructs,
      icon: <Hammer className="size-5" />,
    },
    {
      href: localizedPath(locale, "/calculator"),
      label: messages.nav.calculator,
      icon: <Calculator className="size-5" />,
    },
    {
      href: localizedPath(locale, "/mech"),
      label: messages.nav.mech,
      icon: <Wrench className="size-5" />,
    },
    {
      href: localizedPath(locale, "/plants"),
      label: messages.nav.plants,
      icon: <Sprout className="size-5" />,
    },
    {
      href: localizedPath(locale, "/animals"),
      label: messages.nav.animals,
      icon: <PawPrint className="size-5" />,
    },
  ];
}
