import { describe, expect, it } from "vitest";
import { matchesAllWords, normalizeText } from "./text";

describe("normalizeText", () => {
  it("removes accents, case and surrounding spaces", () => {
    expect(normalizeText("  Óleo de Rubimora ")).toBe("oleo de rubimora");
    expect(normalizeText("Minério")).toBe("minerio");
  });
});

describe("matchesAllWords", () => {
  const haystack = normalizeText("Barra de Bronze Bronze Bar");

  it("requires every word, in any order, ignoring accents and case", () => {
    expect(matchesAllWords(haystack, "bronze barra")).toBe(true);
    expect(matchesAllWords(haystack, "BRÔNZE")).toBe(true);
    expect(matchesAllWords(haystack, "bronze ferro")).toBe(false);
  });

  it("matches everything for a blank query", () => {
    expect(matchesAllWords(haystack, "   ")).toBe(true);
    expect(matchesAllWords(haystack, "")).toBe(true);
  });
});
