import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { datasetManifest } from "@/shared/data/dataset-manifest";
import { env } from "@/shared/config/env";
import { LOCALES } from "@/shared/i18n/config";
import { getMessages } from "@/shared/i18n/get-messages";
import { AppShell } from "@/shared/layout/app-shell";
import { buildNavItems } from "./navigation";
import { resolveLocale } from "./resolve-locale";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const messages = getMessages(await resolveLocale(params));
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: { default: messages.app.name, template: `%s · ${messages.app.name}` },
    description: messages.app.description,
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const messages = getMessages(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell
          locale={locale}
          messages={messages}
          navItems={buildNavItems(locale, messages)}
          gameVersion={datasetManifest.gameVersion}
          supportUrl={env.NEXT_PUBLIC_BMC_URL}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
