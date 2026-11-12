import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CraftCard, type CraftCardEntry, type CraftCardLabels } from "./craft-card";

const labels: CraftCardLabels = {
  cost: "Cost",
  madeIn: "Made in",
  yields: "Yields {count}×",
  unavailable: "Possibly unavailable",
};

const entry: CraftCardEntry = {
  id: "Barrel",
  href: "/en/recipes/constructs/Barrel",
  name: "Barrel",
  icon: "BarrelIcon",
  iconKind: "construct",
  costs: [
    { name: "Hardwood", amount: 10 },
    { name: "Iron Frame", amount: 1234 },
  ],
  madeIn: ["Build mode"],
  unavailable: false,
  searchText: "barrel",
};

const renderCard = (overrides: Partial<CraftCardEntry> = {}, locale = "en") =>
  render(<CraftCard entry={{ ...entry, ...overrides }} locale={locale} labels={labels} />);

describe("CraftCard", () => {
  it("is one link to the detail page, showing icon, name, cost and where it is made", () => {
    const { container } = renderCard();

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/en/recipes/constructs/Barrel");
    expect(within(link).getByText("Barrel")).toBeInTheDocument();
    expect(within(link).getByText("Cost")).toBeInTheDocument();
    expect(within(link).getByText("Hardwood")).toBeInTheDocument();
    expect(within(link).getByText("Build mode")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/icons/constructs/BarrelIcon.png",
    );
  });

  it("formats quantities for the locale", () => {
    renderCard({}, "pt-BR");
    expect(screen.getByText("1.234×")).toBeInTheDocument();
  });

  it("lists every station it is made in", () => {
    renderCard({ madeIn: ["Furnace", "Furnace II", "Furnace III"] });
    expect(screen.getAllByText(/^Furnace/)).toHaveLength(3);
  });

  it("flags possibly unavailable content", () => {
    renderCard({ unavailable: true });
    expect(screen.getByText("Possibly unavailable")).toBeInTheDocument();
  });

  it("mentions the yield only when a craft makes more than one", () => {
    renderCard({ yields: 5 });
    expect(screen.getByText("Yields 5×")).toBeInTheDocument();
  });

  it("omits the yield for a single unit and sections that are empty", () => {
    renderCard({ yields: 1, costs: [], madeIn: [] });

    expect(screen.queryByText(/Yields/)).not.toBeInTheDocument();
    expect(screen.queryByText("Cost")).not.toBeInTheDocument();
    expect(screen.queryByText("Made in:")).not.toBeInTheDocument();
  });
});
