import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ItemListEntry } from "../domain/item-list";
import { ItemCard } from "./item-card";

const labels = {
  tags: { Metal: "Metal", Bar: "Bar", Crafted: "Crafted", Rare: "Rare" },
  sellValue: "Sell value",
  weight: "Weight",
  unavailable: "Possibly unavailable",
};

const entry: ItemListEntry = {
  id: "BronzeBar",
  name: "Bronze Bar",
  icon: "BronzeBarIcon",
  searchText: "bronze bar",
  tags: ["Metal", "Bar", "Crafted", "Rare"],
  weight: 1500,
  sellValue: 2500,
  unavailable: false,
};

describe("ItemCard", () => {
  it("links to the item page and shows the name", () => {
    render(<ItemCard entry={entry} href="/en/items/BronzeBar" locale="en" labels={labels} />);
    expect(screen.getByRole("link", { name: /Bronze Bar/ })).toHaveAttribute(
      "href",
      "/en/items/BronzeBar",
    );
  });

  it("shows at most three categories", () => {
    render(<ItemCard entry={entry} href="/x" locale="en" labels={labels} />);
    expect(screen.getByText("Metal")).toBeInTheDocument();
    expect(screen.getByText("Crafted")).toBeInTheDocument();
    expect(screen.queryByText("Rare")).not.toBeInTheDocument();
  });

  it("formats numbers for the locale and labels them for screen readers", () => {
    render(<ItemCard entry={entry} href="/x" locale="pt-BR" labels={labels} />);
    expect(screen.getByText("Sell value")).toBeInTheDocument();
    expect(screen.getByText("2.500")).toBeInTheDocument();
    expect(screen.getByText("1.500")).toBeInTheDocument();
  });

  it("flags possibly unavailable items", () => {
    render(
      <ItemCard entry={{ ...entry, unavailable: true }} href="/x" locale="en" labels={labels} />,
    );
    expect(screen.getByText("Possibly unavailable")).toBeInTheDocument();
  });

  it("falls back to the raw tag when it has no label", () => {
    render(
      <ItemCard entry={{ ...entry, tags: ["Mystery"] }} href="/x" locale="en" labels={labels} />,
    );
    expect(screen.getByText("Mystery")).toBeInTheDocument();
  });
});
