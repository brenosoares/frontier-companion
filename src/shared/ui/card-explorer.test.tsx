import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CardExplorer, type CardExplorerLabels } from "./card-explorer";
import type { CraftCardEntry } from "./craft-card";

let currentParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/recipes/constructs-storage",
  useSearchParams: () => currentParams,
}));

const labels: CardExplorerLabels = {
  cost: "Cost",
  madeIn: "Made in",
  yields: "Yields {count}×",
  unavailable: "Possibly unavailable",
  search: "Filter",
  searchPlaceholder: "Name…",
  showUnavailable: "Show possibly unavailable content",
  clear: "Clear filters",
  resultsOne: "{count} item",
  resultsOther: "{count} items",
  empty: "Nothing matches.",
  showMore: "Show more ({count} remaining)",
};

const entry = (index: number, overrides: Partial<CraftCardEntry> = {}): CraftCardEntry => ({
  id: `Thing${index}`,
  href: `/en/items/Thing${index}`,
  name: `Thing ${index}`,
  icon: null,
  iconKind: "item",
  costs: [{ name: "Wood", amount: 2 }],
  madeIn: ["Furnace"],
  unavailable: false,
  searchText: `thing ${index} wood`,
  ...overrides,
});

const renderExplorer = (entries: CraftCardEntry[]) =>
  render(<CardExplorer entries={entries} locale="en" labels={labels} />);

const cards = () => screen.queryAllByRole("link");

beforeEach(() => {
  currentParams = new URLSearchParams();
  vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
});

describe("CardExplorer", () => {
  it("shows the cards and their count, hiding unavailable ones by default", () => {
    renderExplorer([entry(1), entry(2), entry(3, { unavailable: true, name: "Secret" })]);

    expect(screen.getByRole("status")).toHaveTextContent("2 items");
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("reveals unavailable cards on request and mirrors it in the URL", async () => {
    renderExplorer([entry(1), entry(2, { unavailable: true })]);
    await userEvent.click(screen.getByLabelText("Show possibly unavailable content"));

    expect(screen.getByRole("status")).toHaveTextContent("2 items");
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/en/recipes/constructs-storage?unavailable=1",
    );
  });

  it("offers the unavailable toggle only when something is unavailable", () => {
    renderExplorer([entry(1), entry(2)]);
    expect(screen.queryByLabelText("Show possibly unavailable content")).not.toBeInTheDocument();
  });

  it("filters by words from the name or the ingredients, ignoring accents", async () => {
    renderExplorer([
      entry(1, { searchText: "barril madeira" }),
      entry(2, { searchText: "caixa ferro" }),
    ]);
    await userEvent.type(screen.getByRole("searchbox", { name: "Filter" }), "MADÉIRA");

    expect(cards()).toHaveLength(1);
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/en/recipes/constructs-storage?q=MAD%C3%89IRA",
    );
  });

  it("pages long lists with a show-more button", async () => {
    renderExplorer(Array.from({ length: 95 }, (_, index) => entry(index)));

    expect(cards()).toHaveLength(40);
    await userEvent.click(screen.getByRole("button", { name: "Show more (55 remaining)" }));
    expect(cards()).toHaveLength(80);
    await userEvent.click(screen.getByRole("button", { name: "Show more (15 remaining)" }));
    expect(cards()).toHaveLength(95);
    expect(screen.queryByRole("button", { name: /Show more/ })).not.toBeInTheDocument();
  });

  it("shows an empty state and lets the user clear the filters", async () => {
    renderExplorer([entry(1)]);
    await userEvent.type(screen.getByRole("searchbox", { name: "Filter" }), "zzz");

    expect(screen.getByText("Nothing matches.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(cards()).toHaveLength(1);
  });

  it("starts from the URL and does not reload on Enter", async () => {
    currentParams = new URLSearchParams("q=thing 2&unavailable=1");
    renderExplorer([entry(1), entry(2, { unavailable: true })]);

    const field = screen.getByRole("searchbox", { name: "Filter" });
    expect(field).toHaveValue("thing 2");
    expect(cards()).toHaveLength(1);

    await userEvent.type(field, "{Enter}");
    expect(field).toHaveValue("thing 2");
  });
});
