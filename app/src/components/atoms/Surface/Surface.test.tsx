import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Surface } from "./Surface";

describe("Surface", () => {
  it("renders a labelled section", () => {
    renderWithProviders(
      <Surface as="section" ariaLabel="Market">
        prices
      </Surface>,
    );

    expect(screen.getByRole("region", { name: "Market" })).toHaveTextContent("prices");
  });
});
