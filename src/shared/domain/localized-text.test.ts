import { describe, expect, it } from "vitest";
import { LocalizedTextSchema, pickLocalized } from "./localized-text";

describe("LocalizedText", () => {
  it("accepts both locales", () => {
    const text = LocalizedTextSchema.parse({ en: "Wheat", "pt-BR": "Trigo" });
    expect(pickLocalized(text, "pt-BR")).toBe("Trigo");
  });

  it("rejects a missing or empty locale", () => {
    expect(LocalizedTextSchema.safeParse({ en: "Wheat" }).success).toBe(false);
    expect(LocalizedTextSchema.safeParse({ en: "Wheat", "pt-BR": "" }).success).toBe(false);
  });
});
