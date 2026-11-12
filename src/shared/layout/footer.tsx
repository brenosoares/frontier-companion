import { Coffee } from "lucide-react";
import Link from "next/link";
import { localizedPath, type Locale } from "@/shared/i18n/config";
import type { Messages } from "@/shared/i18n/messages/types";

interface FooterProps {
  locale: Locale;
  messages: Messages;
  gameVersion: string;
  /** Buy Me a Coffee URL; the support link is omitted when absent. */
  supportUrl?: string | undefined;
}

const LINK_CLASS =
  "rounded underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function Footer({ locale, messages, gameVersion, supportUrl }: FooterProps) {
  const legalLinks = [
    { path: "/privacy", label: messages.footer.privacy },
    { path: "/terms", label: messages.footer.terms },
    { path: "/cookies", label: messages.footer.cookies },
  ] as const;

  return (
    <footer className="border-t border-border px-4 py-8 text-sm text-muted lg:px-8">
      <div className="flex flex-col gap-6">
        <nav aria-label={messages.footer.legalNavigation}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map(({ path, label }) => (
              <li key={path}>
                <Link href={localizedPath(locale, path)} className={LINK_CLASS}>
                  {label}
                </Link>
              </li>
            ))}
            {supportUrl && (
              <li>
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 ${LINK_CLASS}`}
                >
                  <Coffee aria-hidden="true" className="size-4" />
                  {messages.footer.support}
                  <span className="sr-only"> ({messages.a11y.opensInNewTab})</span>
                </a>
              </li>
            )}
          </ul>
        </nav>

        <p className="max-w-3xl">{messages.footer.disclaimer}</p>
        <p>{messages.footer.dataVersion(gameVersion)}</p>
      </div>
    </footer>
  );
}
