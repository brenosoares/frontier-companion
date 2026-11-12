import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getMessages } from "@/shared/i18n/get-messages";
import { Footer } from "./footer";

const renderFooter = (props: { supportUrl?: string } = {}) =>
  render(<Footer locale="en" messages={getMessages("en")} gameVersion="1.0.2571" {...props} />);

describe("Footer", () => {
  it("links to the legal pages under the current locale", () => {
    renderFooter();

    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/en/privacy",
    );
    expect(screen.getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", "/en/terms");
    expect(screen.getByRole("link", { name: "Cookies and storage" })).toHaveAttribute(
      "href",
      "/en/cookies",
    );
  });

  it("always shows the unofficial-project disclaimer and the data version", () => {
    renderFooter();

    expect(screen.getByText(/Fan project, unofficial/)).toBeInTheDocument();
    expect(screen.getByText(/1\.0\.2571/)).toBeInTheDocument();
  });

  it("hides the support link when no URL is configured", () => {
    renderFooter();
    expect(screen.queryByRole("link", { name: /coffee/i })).not.toBeInTheDocument();
  });

  it("opens the support link safely in a new tab when configured", () => {
    renderFooter({ supportUrl: "https://buymeacoffee.com/example" });

    const link = screen.getByRole("link", { name: /Buy me a coffee/ });
    expect(link).toHaveAttribute("href", "https://buymeacoffee.com/example");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
