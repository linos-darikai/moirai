import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { MetricBadge } from "./MetricBadge";

describe("MetricBadge", () => {
  it("shows the metric's label", () => {
    renderWithProviders(<MetricBadge metric="wealth" label="Wealth" />);

    expect(screen.getByText("Wealth")).toBeInTheDocument();
  });
});
