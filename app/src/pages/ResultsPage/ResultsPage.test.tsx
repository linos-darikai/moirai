import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ResultsPage } from "./ResultsPage";

vi.mock("../../lib/engine", () => ({
  generateStartingMap: () =>
    Promise.resolve(Array.from({ length: 256 }, (_, index) => ({ x: index % 16, y: Math.floor(index / 16), owner: null, deposit: null, isCity: false }))),
}));

describe("ResultsPage", () => {
  it("names the winner and ranks every civ with ordinal places", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/match/:matchId/results" element={<ResultsPage />} />
      </Routes>,
      { route: "/match/9B4E/results" },
    );

    expect(await screen.findByRole("heading", { level: 1, name: "iron-turtle wins" })).toBeInTheDocument();
    expect(screen.getByText("1st")).toBeInTheDocument();
    expect(screen.getByText("4th")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Watch the replay" })).toHaveAttribute("href", "/match/9B4E/replay");
  });
});
