import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { StatusChip } from "./StatusChip";

describe("StatusChip", () => {
  it("shows its label", () => {
    renderWithProviders(<StatusChip tone="positive">Revealed</StatusChip>);

    expect(screen.getByText("Revealed")).toBeInTheDocument();
  });
});
