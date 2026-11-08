import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { PanelHeader } from "./PanelHeader";

describe("PanelHeader", () => {
  it("renders the title and the aside content", () => {
    renderWithProviders(<PanelHeader title="Live now" aside={<span>3 matches</span>} />);

    expect(screen.getByRole("heading", { name: "Live now" })).toBeInTheDocument();
    expect(screen.getByText("3 matches")).toBeInTheDocument();
  });
});
