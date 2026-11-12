import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, isLocale, LOCALES, localizedPath, switchLocalePath } from "./config";
import { getMessages } from "./get-messages";

type Tree = { [key: string]: unknown };

/** Flattens a message tree into `path -> kind` so locales can be compared structurally. */
function shape(node: unknown, prefix = ""): string[] {
  if (typeof node === "function") return [`${prefix}()`];
  if (typeof node === "string") return node.trim() === "" ? [`${prefix}!EMPTY`] : [prefix];
  return Object.entries(node as Tree).flatMap(([key, child]) =>
    shape(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("messages", () => {
  it("has the same keys in every locale, with no empty strings", () => {
    const [first, ...others] = LOCALES.map((locale) => shape(getMessages(locale)));
    expect(first?.some((entry) => entry.endsWith("!EMPTY"))).toBe(false);
    for (const other of others) expect(other).toEqual(first);
  });

  it("interpolates versions and counts", () => {
    expect(getMessages("pt-BR").footer.dataVersion("1.0.2571")).toContain("1.0.2571");
    expect(getMessages("en").home.count(285)).toContain("285");
  });
});

describe("locale helpers", () => {
  it("validates locales", () => {
    expect(DEFAULT_LOCALE).toBe("pt-BR");
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("builds localized paths", () => {
    expect(localizedPath("en", "/")).toBe("/en");
    expect(localizedPath("pt-BR", "/privacy")).toBe("/pt-BR/privacy");
  });

  it("switches the locale segment, keeping the rest of the path", () => {
    expect(switchLocalePath("/pt-BR/items/Wheat", "en")).toBe("/en/items/Wheat");
    expect(switchLocalePath("/en", "pt-BR")).toBe("/pt-BR");
    expect(switchLocalePath("/unknown/path", "en")).toBe("/en");
  });
});
