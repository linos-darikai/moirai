import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { BattleSketch } from "./BattleSketch";

describe("BattleSketch", () => {
  it("describes the animation in words for screen readers", () => {
    renderWithProviders(<BattleSketch />);

    const drawing = screen.getByRole("img", { name: /infantry triangle/i });

    expect(drawing).toBeInTheDocument();
  });
});
