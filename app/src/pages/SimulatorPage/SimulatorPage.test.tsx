import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { SimulatorPage } from "./SimulatorPage";

// The browser test environment can't load WASM; give the page civ-core's shape of answer instead.
vi.mock("../../lib/engine", () => ({
  getEngineDescription: () => Promise.resolve("civ-core 0.1.0"),
  generateStartingMap: () =>
    Promise.resolve(
      Array.from({ length: 256 }, (_, index) => {
        const x = index % 16;
        const y = Math.floor(index / 16);
        const cities: Record<string, number> = { "3,3": 0, "12,12": 1, "12,3": 2, "3,12": 3 };
        const owner = cities[`${x},${y}`] ?? null;
        return { x, y, owner, deposit: null, isCity: owner !== null };
      }),
    ),
}));

describe("SimulatorPage", () => {
  it("draws the board for the seed and ranks the civs", async () => {
    renderWithProviders(<SimulatorPage />);

    expect(await screen.findByRole("img", { name: /^Map at turn 60/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Standings" })).toBeInTheDocument();
  });

  it("flags a seed that isn't hex", async () => {
    renderWithProviders(<SimulatorPage />);
    const seed = screen.getByLabelText("Map seed");

    await userEvent.clear(seed);
    await userEvent.type(seed, "not hex");

    expect(await screen.findByRole("alert")).toHaveTextContent("invalid seed");
  });
});
