import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("exposes its value when it has a label", () => {
    renderWithProviders(<ProgressBar value={37} max={60} label="Match progress" />);

    const bar = screen.getByRole("progressbar", { name: "Match progress" });

    expect(bar).toHaveAttribute("aria-valuenow", "37");
  });
});
