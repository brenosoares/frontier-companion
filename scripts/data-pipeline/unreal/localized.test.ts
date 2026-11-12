// @vitest-environment node
import { describe, expect, it } from "vitest";
import { emptyText, rawText } from "../__fixtures__/tables";
import { RawTextSchema, toLocalizedText } from "./localized";

describe("toLocalizedText", () => {
  it("maps SourceString/LocalizedString to en/pt-BR", () => {
    const raw = RawTextSchema.parse(rawText("Wheat", "Trigo"));
    expect(toLocalizedText(raw)).toEqual({ en: "Wheat", "pt-BR": "Trigo" });
  });

  it("returns null for empty invariant text", () => {
    expect(toLocalizedText(RawTextSchema.parse(emptyText))).toBeNull();
  });

  it("returns null when a translation is blank", () => {
    expect(toLocalizedText(RawTextSchema.parse(rawText("Wheat", "  ")))).toBeNull();
  });

  it("uses invariant text for both locales", () => {
    const raw = RawTextSchema.parse({ CultureInvariantString: " Hi " });
    expect(toLocalizedText(raw)).toEqual({ en: "Hi", "pt-BR": "Hi" });
  });
});
