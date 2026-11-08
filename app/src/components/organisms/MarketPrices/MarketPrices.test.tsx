import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { MarketPrices } from "./MarketPrices";

describe("MarketPrices", () => {
  it("shows each price with a signed change", () => {
    renderWithProviders(
      <MarketPrices
        prices={[
          { resource: "ore", price: 1.35, change: 0.11 },
          { resource: "gold", price: 1, change: -0.04 },
        ]}
      />,
    );

    expect(screen.getByText("1.35")).toBeInTheDocument();
    expect(screen.getByText("+11%")).toBeInTheDocument();
    expect(screen.getByText("-4%")).toBeInTheDocument();
  });
});
