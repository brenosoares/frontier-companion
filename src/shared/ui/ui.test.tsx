import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "./badge";
import { Button } from "./button";
import { SearchField } from "./search-field";

describe("Button", () => {
  it("renders a button that handles clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("can style a link as a button via asChild", () => {
    render(
      <Button asChild variant="secondary">
        <a href="https://example.com/x">Go</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute(
      "href",
      "https://example.com/x",
    );
  });

  it("lets a consumer class override a variant class", () => {
    render(<Button className="h-12">Tall</Button>);
    const button = screen.getByRole("button", { name: "Tall" });
    expect(button).toHaveClass("h-12");
    expect(button).not.toHaveClass("h-10");
  });
});

describe("Badge", () => {
  it("renders its content", () => {
    render(<Badge tone="green">New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });
});

describe("SearchField", () => {
  it("exposes a search landmark with an accessible label", () => {
    render(<SearchField label="Search" placeholder="Type…" />);

    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search" })).toBeInTheDocument();
  });

  it("can be disabled", () => {
    render(<SearchField label="Search" disabled />);
    expect(screen.getByRole("searchbox", { name: "Search" })).toBeDisabled();
  });
});
