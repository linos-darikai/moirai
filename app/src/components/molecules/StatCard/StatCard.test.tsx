import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("shows label, value and note", () => {
    renderWithProviders(<StatCard label="Elo" value="1,684" note="+24 last match" noteTone="success" />);

    expect(screen.getByText("Elo")).toBeInTheDocument();
    expect(screen.getByText("1,684")).toBeInTheDocument();
    expect(screen.getByText("+24 last match")).toBeInTheDocument();
  });
});
