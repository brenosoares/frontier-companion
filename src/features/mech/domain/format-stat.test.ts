import { describe, expect, it } from "vitest";
import { formatStatValue } from "./format-stat";

describe("formatStatValue", () => {
  it("shows plain numbers with at most two decimals, grouped per locale", () => {
    expect(formatStatValue("number", 1500, "en", "Yes")).toBe("1,500");
    expect(formatStatValue("number", 1500, "pt-BR", "Sim")).toBe("1.500");
    expect(formatStatValue("number", 1.256, "en", "Yes")).toBe("1.26");
  });

  it("shows fractions as percentages", () => {
    expect(formatStatValue("percent", 0.25, "en", "Yes")).toBe("25%");
    expect(formatStatValue("percent", 0.125, "pt-BR", "Sim")).toBe("12,5%");
  });

  it("shows an unlock as the given word, whatever its value", () => {
    expect(formatStatValue("unlock", 1, "en", "Yes")).toBe("Yes");
    expect(formatStatValue("unlock", 1001, "pt-BR", "Sim")).toBe("Sim");
  });
});
