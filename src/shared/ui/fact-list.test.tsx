import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FactList } from "./fact-list";

describe("FactList", () => {
  it("pairs each label with its value as a description list", () => {
    render(
      <FactList
        facts={[
          { label: "Incubation", value: "2 days" },
          { label: "Space", value: <strong>75 m²</strong> },
        ]}
      />,
    );

    const terms = screen.getAllByRole("term").map((term) => term.textContent);
    const values = screen.getAllByRole("definition").map((value) => value.textContent);
    expect(terms).toEqual(["Incubation", "Space"]);
    expect(values).toEqual(["2 days", "75 m²"]);
  });

  it("renders nothing but an empty list when there are no facts", () => {
    render(<FactList facts={[]} />);
    expect(screen.queryByRole("term")).not.toBeInTheDocument();
  });
});
