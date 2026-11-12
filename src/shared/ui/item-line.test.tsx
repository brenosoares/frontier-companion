import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ItemLine } from "./item-line";

describe("ItemLine", () => {
  it("shows the item's icon next to its text, decoratively", () => {
    const { container } = render(<ItemLine icon="WoodIcon">3× Wood</ItemLine>);

    expect(screen.getByText("3× Wood")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("src", "/icons/items/WoodIcon.png");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("falls back to a generic glyph when the item has no icon", () => {
    const { container } = render(<ItemLine icon={null}>1× Mystery</ItemLine>);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("keeps links passed as text clickable", () => {
    render(
      <ItemLine icon={null}>
        <a href="https://example.com/wood">2× Wood</a>
      </ItemLine>,
    );
    expect(screen.getByRole("link", { name: "2× Wood" })).toHaveAttribute(
      "href",
      "https://example.com/wood",
    );
  });

  it("sizes the tile with the image", () => {
    const { container } = render(
      <ItemLine icon="WoodIcon" size={32}>
        x
      </ItemLine>,
    );
    expect(container.querySelector("img")).toHaveAttribute("width", "32");
    expect(container.firstElementChild?.firstElementChild).toHaveClass("size-10");
  });
});
