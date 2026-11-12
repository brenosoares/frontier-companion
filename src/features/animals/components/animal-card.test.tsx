import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnimalCard } from "./animal-card";

const data = {
  href: "/pt-BR/animals/Tookan",
  name: "Plumaleve",
  icon: "TookanIcon",
  diet: "Potássico",
  product: { name: "Pena", icon: "FeatherIcon" },
  productLabel: "Produto",
};

describe("AnimalCard", () => {
  it("is one link to the animal, showing its name, diet and product", () => {
    render(<AnimalCard {...data} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/pt-BR/animals/Tookan");
    expect(within(link).getByText("Plumaleve")).toBeInTheDocument();
    expect(within(link).getByText("Potássico")).toBeInTheDocument();
    expect(within(link).getByText("Produto")).toBeInTheDocument();
    expect(within(link).getByText("Pena")).toBeInTheDocument();
  });

  it("shows the animal icon and the product icon from their own folders", () => {
    const { container } = render(<AnimalCard {...data} />);
    const sources = [...container.querySelectorAll("img")].map((img) => img.getAttribute("src"));

    expect(sources).toEqual(["/icons/animals/TookanIcon.png", "/icons/items/FeatherIcon.png"]);
  });

  it("falls back to a generic glyph when the animal has no icon", () => {
    const { container } = render(<AnimalCard {...data} icon={null} />);
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });
});
