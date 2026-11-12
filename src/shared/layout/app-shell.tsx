import type { ReactNode } from "react";
import type { Locale } from "@/shared/i18n/config";
import { localizedPath } from "@/shared/i18n/config";
import type { Messages } from "@/shared/i18n/messages/types";
import { Footer } from "./footer";
import { Header } from "./header";
import type { NavItem } from "./nav-item";
import { NavList } from "./nav-list";

interface AppShellProps {
  locale: Locale;
  messages: Messages;
  navItems: readonly NavItem[];
  gameVersion: string;
  supportUrl?: string | undefined;
  children: ReactNode;
}

/** Sidebar navigation on the left; header, content and footer stacked on the right. */
export function AppShell({
  locale,
  messages,
  navItems,
  gameVersion,
  supportUrl,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {messages.a11y.skipToContent}
      </a>

      <aside className="hidden border-r border-border bg-surface lg:block">
        <div className="sticky top-0 h-dvh overflow-y-auto p-4">
          <NavList
            items={navItems}
            label={messages.a11y.mainNavigation}
            exactHrefs={[localizedPath(locale, "/")]}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <Header locale={locale} messages={messages} navItems={navItems} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-8 focus:outline-none lg:px-8"
        >
          {children}
        </main>
        <Footer
          locale={locale}
          messages={messages}
          gameVersion={gameVersion}
          supportUrl={supportUrl}
        />
      </div>
    </div>
  );
}
