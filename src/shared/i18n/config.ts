import { LOCALES, type Locale } from "../domain/localized-text";

export { LOCALES, type Locale };

export const DEFAULT_LOCALE: Locale = "pt-BR";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** `/items` + `pt-BR` -> `/pt-BR/items`. Pass `"/"` for the locale home. */
export function localizedPath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Swaps the leading locale segment: `/pt-BR/items` -> `/en/items`. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const [, first, ...rest] = pathname.split("/");
  return first && isLocale(first) ? `/${[target, ...rest].join("/")}` : `/${target}`;
}
