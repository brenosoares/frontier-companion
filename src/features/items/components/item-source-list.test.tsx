import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getMessages } from "@/shared/i18n/get-messages";
import type { ItemSource } from "../domain/item-source";
import { ItemSourceList } from "./item-source-list";

const source = (overrides: Partial<ItemSource> = {}): ItemSource => ({
  id: "node:Tree:Fiber",
  itemId: "Fiber",
  kind: "node",
  sourceId: "Tree",
  sourceName: { en: "Green Tree", "pt-BR": "Árvore Verde" },
  minAmount: 3,
  maxAmount: 5,
  chance: 100,
  price: null,
  ...overrides,
});

const labels = (locale: "en" | "pt-BR") => getMessages(locale).items.sources;

describe("ItemSourceList", () => {
  it("shows the localized source name, how it is obtained, amount range and chance", () => {
    render(<ItemSourceList sources={[source()]} locale="pt-BR" labels={labels("pt-BR")} />);

    const entry = screen.getByRole("listitem");
    expect(within(entry).getByText("Árvore Verde")).toBeInTheDocument();
    expect(within(entry).getByText("Ao quebrar ou coletar")).toBeInTheDocument();
    expect(within(entry).getByText("3–5×")).toBeInTheDocument();
    expect(within(entry).getByText("100%")).toBeInTheDocument();
  });

  it("shows a single amount when there is no range, and a fractional chance", () => {
    render(
      <ItemSourceList
        sources={[source({ minAmount: 2, maxAmount: 2, chance: 33.5 })]}
        locale="en"
        labels={labels("en")}
      />,
    );

    expect(screen.getByText("2×")).toBeInTheDocument();
    expect(screen.getByText("33.5%")).toBeInTheDocument();
  });

  it("labels amount and chance for screen readers", () => {
    render(<ItemSourceList sources={[source()]} locale="en" labels={labels("en")} />);

    expect(screen.getByText("Amount:")).toBeInTheDocument();
    expect(screen.getByText("Chance:")).toBeInTheDocument();
  });

  it("describes every kind of source", () => {
    const kinds = [
      "node",
      "plant",
      "plant-fruit",
      "animal-product",
      "animal-droppings",
      "critter-feed",
      "large-item",
      "hazard",
      "loot-goblin",
      "mutation",
      "merchant",
      "care-package",
    ] as const;
    render(
      <ItemSourceList
        sources={kinds.map((kind) => source({ id: kind, kind, sourceId: kind }))}
        locale="en"
        labels={labels("en")}
      />,
    );

    for (const kind of kinds) {
      expect(screen.getByText(labels("en").kinds[kind])).toBeInTheDocument();
    }
  });

  it("shows a merchant by its kind, with the price and without invented amount or chance", () => {
    render(
      <ItemSourceList
        sources={[
          source({
            kind: "merchant",
            sourceName: null,
            minAmount: null,
            maxAmount: null,
            chance: null,
            price: 1234,
          }),
        ]}
        locale="pt-BR"
        labels={labels("pt-BR")}
      />,
    );

    expect(screen.getByText("Vendido por mercadores")).toBeInTheDocument();
    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(screen.queryByText("Quantidade:")).not.toBeInTheDocument();
    expect(screen.queryByText("Chance:")).not.toBeInTheDocument();
  });

  it("links a mutation to the item page of the seeds it grows from", () => {
    render(
      <ItemSourceList
        sources={[
          source({
            kind: "mutation",
            sourceId: "WheatSeeds_Refined",
            sourceName: { en: "Spliced Wheat Seeds", "pt-BR": "Sementes de Trigo Modificadas" },
            minAmount: null,
            maxAmount: null,
            chance: null,
          }),
        ]}
        locale="pt-BR"
        labels={labels("pt-BR")}
      />,
    );

    expect(screen.getByRole("link", { name: "Sementes de Trigo Modificadas" })).toHaveAttribute(
      "href",
      "/pt-BR/items/WheatSeeds_Refined",
    );
    expect(screen.getByText("Cresce de sementes modificadas")).toBeInTheDocument();
  });

  it("does not make a plain source a link", () => {
    render(<ItemSourceList sources={[source()]} locale="en" labels={labels("en")} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
