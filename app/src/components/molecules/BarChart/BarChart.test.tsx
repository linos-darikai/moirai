import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { BarChart } from "./BarChart";

describe("BarChart", () => {
  it("is one described image with axis labels", () => {
    renderWithProviders(
      <BarChart
        label="Tiles owned at turns 10 and 20"
        max={10}
        groups={[
          { key: "10", axisLabel: "t10", bars: [{ value: 4, color: { civ: 0 } }] },
          { key: "20", axisLabel: "t20", bars: [{ value: 9, color: { civ: 0 } }] },
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: "Tiles owned at turns 10 and 20" })).toBeInTheDocument();
    expect(screen.getByText("t20")).toBeInTheDocument();
  });
});
