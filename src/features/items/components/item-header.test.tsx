import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getMessages } from "@/shared/i18n/get-messages";
import type { Item } from "../domain/item";
import { ItemHeader } from "./item-header";

const item: Item = {
  id: "BronzeBar",
  name: { en: "Bronze Bar", "pt-BR": "Barra de Bronze" },
  description: { en: "An alloy.", "pt-BR": "Uma liga." },
  tags: ["Metal", "StaticPricing"],
  weight: 2000,
  sellValue: 15,
  icon: "BronzeBarIcon",
  featureFlag: null,
  isVirtual: false,
};

const renderHeader = (overrides: Partial<Item> = {}, locale: "en" | "pt-BR" = "en") =>
  render(
    <ItemHeader
      item={{ ...item, ...overrides }}
      locale={locale}
      labels={getMessages(locale).items}
    />,
  );

describe("ItemHeader", () => {
  it("shows the localized name, description, categories and stats", () => {
    renderHeader({}, "pt-BR");

    expect(screen.getByRole("heading", { level: 1, name: "Barra de Bronze" })).toBeInTheDocument();
    expect(screen.getByText("Uma liga.")).toBeInTheDocument();
    expect(screen.getByText("Metal")).toBeInTheDocument();
    expect(screen.getByText("2.000")).toBeInTheDocument();
  });

  it("hides internal tags and falls back when there is no description", () => {
    renderHeader({ description: null });

    expect(screen.queryByText("StaticPricing")).not.toBeInTheDocument();
    expect(screen.getByText("No description.")).toBeInTheDocument();
  });

  it("shows no warning for an item that is not gated by a flag", () => {
    renderHeader();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("warns that an item still gated by an unconfirmed flag may be unavailable", () => {
    renderHeader({ featureFlag: "SomeNewFeature" });
    expect(screen.getByRole("note")).toHaveTextContent("may not be available");
  });
});
