"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { LOCALES, type Locale, switchLocalePath } from "@/shared/i18n/config";

interface LanguageSwitcherProps {
  current: Locale;
  label: string;
  names: Record<Locale, string>;
}

export function LanguageSwitcher({ current, label, names }: LanguageSwitcherProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label}>
      <ul className="flex items-center gap-1">
        {LOCALES.map((locale) => (
          <li key={locale}>
            <Link
              href={switchLocalePath(pathname, locale)}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? "true" : undefined}
              title={names[locale]}
              className={cn(
                "inline-flex h-8 items-center rounded-md px-2 text-xs font-semibold uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                locale === current
                  ? "bg-surface-hover text-foreground"
                  : "text-muted hover:bg-surface-hover hover:text-foreground",
              )}
            >
              {locale === "pt-BR" ? "PT" : locale}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
