import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getMessages } from "@/shared/i18n/get-messages";
import type { RecipeView } from "../domain/recipe-view";
import { RecipeList } from "./recipe-list";

const labels = getMessages("en").recipes;
const itemHref = (id: string) => `/en/items/${id}`;

const recipe: RecipeView = {
  id: "Bar1",
  output: { itemId: "Bar", name: "Bronze Bar", amount: 2 },
  inputs: [
    { itemId: "Ore", name: "Copper Ore", amount: 3 },
    { itemId: "Wood", name: "Wood", amount: 1 },
  ],
  timeSeconds: 120,
  bookLevel: 0,
  stations: ["Furnace"],
};

const renderList = (recipes: RecipeView[], currentItemId?: string) =>
  render(
    <RecipeList
      recipes={recipes}
      locale="en"
      labels={labels}
      itemHref={itemHref}
      {...(currentItemId && { currentItemId })}
    />,
  );

describe("RecipeList", () => {
  it("links ingredients and output to their item pages", () => {
    renderList([recipe]);

    expect(screen.getByRole("link", { name: "3× Copper Ore" })).toHaveAttribute(
      "href",
      "/en/items/Ore",
    );
    expect(screen.getByRole("link", { name: "2× Bronze Bar" })).toHaveAttribute(
      "href",
      "/en/items/Bar",
    );
  });

  it("renders the current item as plain text, not a link", () => {
    renderList([recipe], "Bar");

    expect(screen.queryByRole("link", { name: "2× Bronze Bar" })).not.toBeInTheDocument();
    expect(screen.getByText("2× Bronze Bar")).toBeInTheDocument();
  });

  it("shows time, station and no book requirement when level is 0", () => {
    renderList([recipe]);

    expect(screen.getByText(/2\s?min/)).toBeInTheDocument();
    expect(screen.getByText("Furnace")).toBeInTheDocument();
    expect(screen.queryByText(/recipe book level/i)).not.toBeInTheDocument();
  });

  it("shows instant crafting, a missing station and a book requirement", () => {
    renderList([{ ...recipe, timeSeconds: 0, stations: [], bookLevel: 2 }]);

    expect(screen.getByText("Instant")).toBeInTheDocument();
    expect(screen.getByText("No station defined")).toBeInTheDocument();
    expect(screen.getByText("Requires recipe book level 2")).toBeInTheDocument();
  });
});
