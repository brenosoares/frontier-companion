import { z } from "zod";
import type { LocalizedText } from "@/shared/domain/localized-text";

/** Raw FText: either translated (`SourceString` EN + `LocalizedString` pt-BR) or empty. */
export const RawTextSchema = z.union([
  z.object({ SourceString: z.string(), LocalizedString: z.string() }),
  z.object({ CultureInvariantString: z.string().nullable() }),
]);

export type RawText = z.infer<typeof RawTextSchema>;

/** Returns null when the text is empty/untranslated. */
export function toLocalizedText(raw: RawText): LocalizedText | null {
  if ("CultureInvariantString" in raw) {
    const text = raw.CultureInvariantString?.trim();
    return text ? { en: text, "pt-BR": text } : null;
  }
  const en = raw.SourceString.trim();
  const ptBR = raw.LocalizedString.trim();
  return en && ptBR ? { en, "pt-BR": ptBR } : null;
}
