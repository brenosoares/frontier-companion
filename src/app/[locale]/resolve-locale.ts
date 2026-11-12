import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/shared/i18n/config";

/** Awaits route params and returns a supported locale, or renders the 404 page. */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
