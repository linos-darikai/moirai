import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { MatchPage } from "./MatchPage";

vi.mock("../../lib/engine", () => ({
  generateStartingMap: () =>
    Promise.resolve(Array.from({ length: 256 }, (_, index) => ({ x: index % 16, y: Math.floor(index / 16), owner: null, deposit: null, isCity: false }))),
}));

describe("MatchPage", () => {
  it("shows the turn, the civs and a translated feed", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/match/:matchId" element={<MatchPage />} />
      </Routes>,
      { route: "/match/9C21" },
    );

    expect(await screen.findByRole("heading", { level: 1, name: "Turn 37 of 60" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Match progress", hidden: true })).toHaveAttribute("aria-valuenow", "37");
    // Desktop columns and phone tabs both render; the CSS shows one of them per screen width.
    expect(screen.getAllByText("iron-turtle (you)").length).toBeGreaterThan(0);
    expect(screen.getByText("red-raider attacked wide-expander at (9, 6). 2 tiles changed hands.")).toBeInTheDocument();
  });
});
