import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ItemListEntry } from "../domain/item-list";
import { ItemExplorer, type ItemExplorerLabels } from "./item-explorer";

let currentParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/items",
  useSearchParams: () => currentParams,
}));

const labels: ItemExplorerLabels = {
  search: "Filter items",
  searchPlaceholder: "Item name…",
  category: "Category",
  allCategories: "All categories",
  sort: "Sort by",
  sortOptions: { name: "Name", value: "Sell value", weight: "Weight" },
  showUnavailable: "Show possibly unavailable content",
  clear: "Clear filters",
  resultsOne: "{count} item",
  resultsOther: "{count} items",
  empty: "No items match these filters.",
  tags: { Metal: "Metal", Oil: "Oil", Secret: "Secret" },
  sellValue: "Sell value",
  weight: "Weight",
  unavailable: "Possibly unavailable",
};

const entry = (id: string, overrides: Partial<ItemListEntry> = {}): ItemListEntry => ({
  id,
  name: id,
  icon: null,
  searchText: id.toLowerCase(),
  tags: [],
  weight: 1,
  sellValue: 1,
  unavailable: false,
  ...overrides,
});

const entries = [
  entry("Rabberry Oil", { tags: ["Oil"], sellValue: 135 }),
  entry("Copper Ore", { tags: ["Metal"], sellValue: 20 }),
  entry("Tin Ore", { tags: ["Metal"], sellValue: 30 }),
  entry("Secret Thing", { tags: ["Secret"], unavailable: true }),
];

const renderExplorer = () => render(<ItemExplorer entries={entries} locale="en" labels={labels} />);
// In the explorer, item cards are the only links.
const names = () => screen.getAllByRole("link").map((link) => link.textContent);

beforeEach(() => {
  currentParams = new URLSearchParams();
  vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
});

describe("ItemExplorer", () => {
  it("lists available items sorted by name and hides unavailable ones by default", () => {
    renderExplorer();

    expect(screen.getByRole("status")).toHaveTextContent("3 items");
    expect(names().map((text) => text?.match(/Copper Ore|Rabberry Oil|Tin Ore/)?.[0])).toEqual([
      "Copper Ore",
      "Rabberry Oil",
      "Tin Ore",
    ]);
    expect(screen.queryByText("Secret Thing")).not.toBeInTheDocument();
  });

  it("filters by text and mirrors the query in the URL", async () => {
    renderExplorer();
    await userEvent.type(screen.getByRole("searchbox", { name: "Filter items" }), "ore");

    expect(screen.getByRole("status")).toHaveTextContent("2 items");
    expect(window.history.replaceState).toHaveBeenLastCalledWith(null, "", "/en/items?q=ore");
  });

  it("filters by category", async () => {
    renderExplorer();
    await userEvent.selectOptions(screen.getByLabelText("Category"), "Metal");

    expect(screen.getByRole("status")).toHaveTextContent("2 items");
    expect(screen.queryByText("Rabberry Oil")).not.toBeInTheDocument();
  });

  it("reveals unavailable content, and its categories, on request", async () => {
    renderExplorer();
    const category = screen.getByLabelText("Category");
    expect(within(category).queryByRole("option", { name: "Secret" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Show possibly unavailable content"));

    expect(screen.getByRole("status")).toHaveTextContent("4 items");
    expect(within(category).getByRole("option", { name: "Secret" })).toBeInTheDocument();
    expect(screen.getByText("Possibly unavailable")).toBeInTheDocument();
  });

  it("sorts by sell value, highest first", async () => {
    renderExplorer();
    await userEvent.selectOptions(screen.getByLabelText("Sort by"), "value");

    expect(names()[0]).toContain("Rabberry Oil");
  });

  it("shows an empty state and lets the user clear filters", async () => {
    renderExplorer();
    await userEvent.type(screen.getByRole("searchbox", { name: "Filter items" }), "zzz");

    expect(screen.getByText("No items match these filters.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("status")).toHaveTextContent("3 items");
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("starts from the state in the URL", () => {
    currentParams = new URLSearchParams("q=tin&sort=weight");
    renderExplorer();

    expect(screen.getByRole("searchbox", { name: "Filter items" })).toHaveValue("tin");
    expect(screen.getByLabelText("Sort by")).toHaveValue("weight");
    expect(screen.getByRole("status")).toHaveTextContent("1 item");
  });

  it("ignores a category from the URL that does not exist", () => {
    currentParams = new URLSearchParams("tag=Nonexistent");
    renderExplorer();

    expect(screen.getByRole("status")).toHaveTextContent("3 items");
    expect(screen.getByLabelText("Category")).toHaveValue("");
  });

  it("does not reload the page when the filter form is submitted", async () => {
    renderExplorer();
    const field = screen.getByRole("searchbox", { name: "Filter items" });
    await userEvent.type(field, "ore{Enter}");

    expect(field).toHaveValue("ore");
  });

  it("offers the availability toggle only when some item is possibly unavailable", () => {
    render(
      <ItemExplorer
        entries={entries.filter((entry) => !entry.unavailable)}
        locale="en"
        labels={labels}
      />,
    );
    expect(screen.queryByLabelText("Show possibly unavailable content")).not.toBeInTheDocument();
  });
});
