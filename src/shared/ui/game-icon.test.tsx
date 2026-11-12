import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameIcon } from "./game-icon";

describe("GameIcon", () => {
  it("serves the pixel-art file of the item, decoratively", () => {
    const { container } = render(<GameIcon kind="item" icon="BronzeBarIcon" size={40} />);
    const image = container.querySelector("img");

    expect(image).toHaveAttribute("src", "/icons/items/BronzeBarIcon.png");
    expect(image).toHaveAttribute("alt", "");
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back to a generic glyph when the item has no icon", () => {
    const { container } = render(<GameIcon kind="item" icon={null} size={40} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("serves construct icons from their own folder", () => {
    const { container } = render(<GameIcon kind="construct" icon="BarrelIcon" size={40} />);
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/icons/constructs/BarrelIcon.png",
    );
  });
});
