import { z } from "zod";

export const LOCALES = ["en", "pt-BR"] as const;
export type Locale = (typeof LOCALES)[number];

export const LocalizedTextSchema = z.object({
  en: z.string().min(1),
  "pt-BR": z.string().min(1),
});

export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

export function pickLocalized(text: LocalizedText, locale: Locale): string {
  return text[locale];
}
