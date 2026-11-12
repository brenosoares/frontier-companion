/** Lowercase, trimmed and without diacritics: "Óleo" and "oleo" compare equal. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Every word of the query must appear in the (already normalized) haystack. Blank matches all. */
export function matchesAllWords(haystack: string, query: string): boolean {
  return normalizeText(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}
