import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { RulesPage } from "./RulesPage";

describe("RulesPage", () => {
  it("links to every section from the contents", () => {
    renderWithProviders(<RulesPage />);

    const contents = screen.getByRole("navigation", { name: "On this page" });

    expect(within(contents).getAllByRole("link")).toHaveLength(9);
    expect(within(contents).getByRole("link", { name: "Warfare" })).toHaveAttribute("href", "#rules-warfare");
  });

  it("shows the rule numbers from the rules data", () => {
    renderWithProviders(<RulesPage />);

    expect(screen.getByText("claim_tile buys one free tile next to your land for 10 Food and 10 Gold.")).toBeInTheDocument();
    const settlerRow = screen.getByRole("row", { name: /Settler/ });
    expect(settlerRow).toHaveTextContent("30 food + 10 ore");
    expect(screen.getByRole("row", { name: /^4 5 320$/ })).toBeInTheDocument();
  });
});
