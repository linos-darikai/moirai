import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { MapLegend } from "./MapLegend";

describe("MapLegend", () => {
  it("lists every mark", () => {
    renderWithProviders(
      <MapLegend
        label="Map legend"
        foodLabel="Food deposit"
        oreLabel="Ore deposit"
        goldLabel="Gold deposit"
        cityLabel="City"
        citySiteLabel="City site"
        contestedLabel="Contested tile"
      />,
    );

    expect(screen.getByRole("list", { name: "Map legend" }).children).toHaveLength(6);
  });
});
