import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ReplayPage } from "./ReplayPage";

vi.mock("../../lib/engine", () => ({
  generateStartingMap: () =>
    Promise.resolve(Array.from({ length: 256 }, (_, index) => ({ x: index % 16, y: Math.floor(index / 16), owner: null, deposit: null, isCity: false }))),
}));

describe("ReplayPage", () => {
  it("jumps to a key moment and explains it", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/match/:matchId/replay" element={<ReplayPage />} />
      </Routes>,
      { route: "/match/9B4E/replay" },
    );

    await userEvent.click(await screen.findByRole("button", { name: "Jump to turn 21: First battle on the north border" }));

    expect(screen.getByRole("heading", { level: 1, name: "Replay · Turn 21 of 60" })).toBeInTheDocument();
    expect(screen.getByText("red-raider attacked as soon as its army was 30% bigger than a neighbour.")).toBeInTheDocument();
  });
});
