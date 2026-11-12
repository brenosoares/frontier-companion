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
    const kinds = ["node", "plant", "animal-product", "animal-droppings", "animal-egg"] as const;
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
});
