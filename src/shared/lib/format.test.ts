import { describe, expect, it } from "vitest";
import { formatDuration, formatNumber, formatTemplate } from "./format";

describe("formatTemplate", () => {
  it("replaces known placeholders and leaves unknown ones untouched", () => {
    expect(formatTemplate("{count} items in {place}", { count: 3 })).toBe("3 items in {place}");
  });

  it("replaces repeated placeholders", () => {
    expect(formatTemplate("{a}-{a}", { a: "x" })).toBe("x-x");
  });
});

describe("formatDuration", () => {
  it("uses seconds below one minute", () => {
    expect(formatDuration(30, "en")).toMatch(/30\s?sec/);
  });

  it("uses minutes for whole minutes", () => {
    expect(formatDuration(120, "en")).toMatch(/^2\s?min$/);
  });

  it("combines minutes and seconds", () => {
    expect(formatDuration(90, "en")).toMatch(/1\s?min 30\s?sec/);
  });

  it("localizes the numbers and units", () => {
    expect(formatDuration(60, "pt-BR")).toMatch(/^1\s?min$/);
  });
});

describe("formatNumber", () => {
  it("applies locale grouping", () => {
    expect(formatNumber(1234, "en")).toBe("1,234");
    expect(formatNumber(1234, "pt-BR")).toBe("1.234");
  });
});
