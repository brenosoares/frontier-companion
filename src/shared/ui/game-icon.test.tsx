import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ItemIcon } from "./item-icon";

describe("ItemIcon", () => {
  it("serves the pixel-art file of the item, decoratively", () => {
    const { container } = render(<ItemIcon icon="BronzeBarIcon" size={40} />);
    const image = container.querySelector("img");

    expect(image).toHaveAttribute("src", "/icons/items/BronzeBarIcon.png");
    expect(image).toHaveAttribute("alt", "");
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back to a generic glyph when the item has no icon", () => {
    const { container } = render(<ItemIcon icon={null} size={40} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
