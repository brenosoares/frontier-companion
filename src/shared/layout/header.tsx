import Link from "next/link";
import { localizedPath, type Locale } from "@/shared/i18n/config";
import type { Messages } from "@/shared/i18n/messages/types";
import { SearchField } from "@/shared/ui/search-field";
import { LanguageSwitcher } from "./language-switcher";
import { LogoMark } from "./logo";
import { MobileNav } from "./mobile-nav";
import type { NavItem } from "./nav-item";

interface HeaderProps {
  locale: Locale;
  messages: Messages;
  navItems: readonly NavItem[];
}

export function Header({ locale, messages, navItems }: HeaderProps) {
  const home = localizedPath(locale, "/");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:flex-nowrap lg:px-8">
        <MobileNav
          items={navItems}
          exactHrefs={[home]}
          labels={{
            open: messages.a11y.openMenu,
            close: messages.a11y.closeMenu,
            title: messages.a11y.menuTitle,
            navigation: messages.a11y.mainNavigation,
          }}
        />
        <Link
          href={home}
          className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <LogoMark className="size-7" />
          <span className="font-semibold tracking-tight">{messages.app.name}</span>
        </Link>

        <div className="order-last w-full md:order-none md:mx-auto md:max-w-md md:flex-1">
          <SearchField
            label={messages.search.label}
            placeholder={messages.search.placeholder}
            action={localizedPath(locale, "/items")}
          />
        </div>

        <div className="ml-auto md:ml-0">
          <LanguageSwitcher
            current={locale}
            label={messages.a11y.languageNavigation}
            names={messages.language}
          />
        </div>
      </div>
    </header>
  );
}
