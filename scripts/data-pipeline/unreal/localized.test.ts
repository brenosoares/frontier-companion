// @vitest-environment node
import { describe, expect, it } from "vitest";
import { emptyText, rawText } from "../__fixtures__/tables";
import { RawTextSchema, toLocalizedText, toPlainText } from "./localized";

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

describe("toPlainText", () => {
  it("strips rich text tags and keeps key bindings readable", () => {
    expect(
      toPlainText({
        en: "Use <Mark1>Hose</> ({UseToolPrimary})",
        "pt-BR": "Use o <Mark2>Jato</> ({Tecla})",
      }),
    ).toEqual({ en: "Use Hose ([UseToolPrimary])", "pt-BR": "Use o Jato ([Tecla])" });
  });

  it("passes null through", () => {
    expect(toPlainText(null)).toBeNull();
  });
});
