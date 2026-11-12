import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/shared/i18n/config";

/** Narrows a route segment to a supported locale, or renders the 404 page. */
export function assertLocale(value: string): Locale {
  if (!isLocale(value)) notFound();
  return value;
}

/** Awaits route params and returns a supported locale, or renders the 404 page. */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  return assertLocale((await params).locale);
}
