import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Recipe } from "../domain/recipe";
import {
  type CalculatorItem,
  type CalculatorLabels,
  MaterialsCalculator,
} from "./materials-calculator";

let currentParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/calculator",
  useSearchParams: () => currentParams,
}));

const labels: CalculatorLabels = {
  item: "Item to craft",
  chooseItem: "Choose an item…",
  quantity: "Quantity",
  empty: "Choose an item to calculate.",
  rawItem: "This item is not crafted.",
  materials: "Materials to obtain",
  materialsHint: "hint",
  noKnownSource: "Unknown source",
  steps: "Crafting steps",
  stepsHint: "hint",
  batchesOne: "{count} batch",
  batchesOther: "{count} batches",
  leftover: "{count} left over",
  timePerBatch: "{time} per batch",
  instant: "Instant",
  recipeVariant: "Recipe",
};

const recipe = (
  id: string,
  output: [string, number],
  inputs: Record<string, number>,
  overrides: Partial<Recipe> = {},
): Recipe => ({
  id,
  output: { itemId: output[0], amount: output[1] },
  inputs: Object.entries(inputs).map(([itemId, amount]) => ({ itemId, amount })),
  timeSeconds: 60,
  bookLevel: 0,
  stations: ["Furnace"],
  ...overrides,
});

const recipes: Recipe[] = [
  recipe("Bar1", ["Bar", 1], { Ore: 1, Wood: 1 }),
  recipe("Bar5", ["Bar", 5], { Ore: 5, Wood: 5 }),
  recipe("Seeds2", ["Seeds", 2], { Plant: 1 }),
  recipe("Seeds3", ["Seeds", 3], { Plant_Rare: 1 }),
];

const item = (name: string, hasSource = true, directlyObtainable = hasSource): CalculatorItem => ({
  name,
  icon: `${name.replace(/\W/g, "")}Icon`,
  hasSource,
  directlyObtainable,
});
const items = {
  Bar: item("Bronze Bar"),
  Ore: item("Copper Ore"),
  Wood: item("Wood"),
  Seeds: item("Seeds"),
  Plant: item("Plant"),
  Plant_Rare: item("Rare Plant", false),
};

const renderCalculator = () =>
  render(
    <MaterialsCalculator
      recipes={recipes}
      items={items}
      stations={{ Furnace: "Furnace" }}
      locale="en"
      labels={labels}
    />,
  );

const materials = () =>
  within(screen.getByRole("region", { name: "Materials to obtain" })).getAllByRole("listitem");

beforeEach(() => {
  currentParams = new URLSearchParams();
  vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);
});

describe("MaterialsCalculator", () => {
  it("asks for an item first and offers only craftable items, sorted", () => {
    renderCalculator();

    expect(screen.getByText("Choose an item to calculate.")).toBeInTheDocument();
    const options = within(screen.getByLabelText("Item to craft"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["Choose an item…", "Bronze Bar", "Seeds"]);
  });

  it("calculates materials and steps for the chosen item and mirrors it in the URL", async () => {
    renderCalculator();
    await userEvent.selectOptions(screen.getByLabelText("Item to craft"), "Bar");

    expect(materials().map((li) => li.textContent)).toEqual([
      expect.stringContaining("1× Copper Ore"),
      expect.stringContaining("1× Wood"),
    ]);
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/en/calculator?item=Bar",
    );
  });

  it("recomputes when the quantity changes, using the smallest batch", async () => {
    renderCalculator();
    await userEvent.selectOptions(screen.getByLabelText("Item to craft"), "Bar");
    await userEvent.clear(screen.getByLabelText("Quantity"));
    await userEvent.type(screen.getByLabelText("Quantity"), "12");

    expect(materials().map((li) => li.textContent)).toEqual([
      expect.stringContaining("12× Copper Ore"),
      expect.stringContaining("12× Wood"),
    ]);
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/en/calculator?item=Bar&qty=12",
    );
  });

  it("only accepts digits in the quantity and restores a valid value when left empty", async () => {
    renderCalculator();
    const field = screen.getByLabelText("Quantity");

    await userEvent.clear(field);
    await userEvent.type(field, "a1b2");
    expect(field).toHaveValue("12");

    await userEvent.clear(field);
    await userEvent.tab();
    expect(field).toHaveValue("1");
  });

  it("shows the leftover when batches overshoot", async () => {
    renderCalculator();
    await userEvent.selectOptions(screen.getByLabelText("Item to craft"), "Seeds");
    await userEvent.clear(screen.getByLabelText("Quantity"));
    await userEvent.type(screen.getByLabelText("Quantity"), "3");

    expect(screen.getByText("2 batches")).toBeInTheDocument();
    expect(screen.getByText("1 left over")).toBeInTheDocument();
  });

  it("offers recipe variants and recalculates when one is chosen", async () => {
    renderCalculator();
    await userEvent.selectOptions(screen.getByLabelText("Item to craft"), "Seeds");

    // The default avoids the rare plant, which has no known source.
    expect(materials().map((li) => li.textContent)).toEqual([expect.stringContaining("Plant")]);
    expect(screen.queryByText("Unknown source")).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Recipe"), "Seeds3");

    expect(screen.getByText("Unknown source")).toBeInTheDocument();
    expect(window.history.replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "/en/calculator?item=Seeds&v=Seeds%3ASeeds3",
    );
  });

  it("describes each variant by what goes in and what comes out", async () => {
    renderCalculator();
    await userEvent.selectOptions(screen.getByLabelText("Item to craft"), "Seeds");

    const options = within(screen.getByLabelText("Recipe"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["1× Plant → 2× Seeds", "1× Rare Plant → 3× Seeds"]);
  });

  it("says plainly that an instant batch is instant, not 'instant per batch'", async () => {
    render(
      <MaterialsCalculator
        recipes={[recipe("Fast1", ["Fast", 1], { Ore: 1 }, { timeSeconds: 0 })]}
        items={{ Fast: item("Fast Thing"), Ore: item("Copper Ore") }}
        stations={{ Furnace: "Furnace" }}
        locale="en"
        labels={labels}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Item to craft"), "Fast");

    expect(screen.getByText("Instant")).toBeInTheDocument();
    expect(screen.queryByText(/per batch/)).not.toBeInTheDocument();
  });

  it("shows the time per batch when it takes time", async () => {
    renderCalculator();
    await userEvent.selectOptions(screen.getByLabelText("Item to craft"), "Bar");
    expect(screen.getByText(/1\s?min per batch/)).toBeInTheDocument();
  });

  it("does not offer a variant picker for items with a single way to be made", async () => {
    renderCalculator();
    await userEvent.selectOptions(screen.getByLabelText("Item to craft"), "Bar");
    expect(screen.queryByLabelText("Recipe")).not.toBeInTheDocument();
  });

  it("starts from the state in the URL", () => {
    currentParams = new URLSearchParams("item=Bar&qty=7");
    renderCalculator();

    expect(screen.getByLabelText("Item to craft")).toHaveValue("Bar");
    expect(screen.getByLabelText("Quantity")).toHaveValue("7");
    expect(materials()[0]).toHaveTextContent("7× Copper Ore");
  });

  it("explains that raw items are not crafted instead of showing an empty plan", () => {
    currentParams = new URLSearchParams("item=Ore");
    renderCalculator();

    expect(screen.getByText("This item is not crafted.")).toBeInTheDocument();
    expect(screen.queryByText("Materials to obtain")).not.toBeInTheDocument();
  });

  it("ignores an unknown or hostile item in the URL", () => {
    currentParams = new URLSearchParams("item=Nope&qty=abc");
    renderCalculator();

    expect(screen.getByText("Choose an item to calculate.")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity")).toHaveValue("1");
  });

  it("links every material to its item page", async () => {
    renderCalculator();
    await userEvent.selectOptions(screen.getByLabelText("Item to craft"), "Bar");

    expect(screen.getAllByRole("link", { name: "Copper Ore" })[0]).toHaveAttribute(
      "href",
      "/en/items/Ore",
    );
  });

  it("shows the icon of each ingredient of a crafting step", async () => {
    renderCalculator();
    await userEvent.selectOptions(screen.getByLabelText("Item to craft"), "Bar");

    const steps = screen.getByRole("region", { name: "Crafting steps" });
    const icons = [...steps.querySelectorAll("img")].map((img) => img.getAttribute("src"));

    expect(icons).toContain("/icons/items/CopperOreIcon.png");
    expect(icons).toContain("/icons/items/WoodIcon.png");
  });

  it("avoids a mutated ingredient by default but does not call its origin unknown", async () => {
    render(
      <MaterialsCalculator
        recipes={recipes}
        // The rare plant has a known source (mutation) but cannot be obtained directly.
        items={{ ...items, Plant_Rare: item("Rare Plant", true, false) }}
        stations={{ Furnace: "Furnace" }}
        locale="en"
        labels={labels}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Item to craft"), "Seeds");
    expect(materials().map((li) => li.textContent)).toEqual([expect.stringContaining("Plant")]);
    expect(materials()[0]).not.toHaveTextContent("Rare");

    await userEvent.selectOptions(screen.getByLabelText("Recipe"), "Seeds3");
    expect(materials()[0]).toHaveTextContent("Rare Plant");
    expect(screen.queryByText("Unknown source")).not.toBeInTheDocument();
  });
});
