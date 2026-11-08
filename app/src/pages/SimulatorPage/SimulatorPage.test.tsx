import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MapTile, SimulatedCiv, SimulationResult } from "../../types/map";
import { renderWithProviders } from "../../test/renderWithProviders";
import { SimulatorPage } from "./SimulatorPage";

// The browser test environment can't load WASM; give the page civ-core's shape of answer instead:
// a 3-turn match where civ 0 owns more land each turn.
function tilesOwnedBy(counts: number[]): MapTile[] {
  const owners: (MapTile["owner"])[] = [];
  counts.forEach((count, civ) => {
    for (let index = 0; index < count; index++) owners.push(civ as MapTile["owner"]);
  });
  return Array.from({ length: 256 }, (_, index) => ({
    x: index % 16,
    y: Math.floor(index / 16),
    owner: owners[index] ?? null,
    deposit: null,
    isCity: false,
    isCitySite: false,
  }));
}
function civ(tiles: number): SimulatedCiv {
  return { isAlive: true, tiles, cities: 1, army: 0, food: 0, ore: 0, gold: 0, coins: 0, wealth: 0, marching: 0, armyAt: null };
}
const simulation = vi.hoisted(() => ({ calls: [] as string[][] }));
vi.mock("../../lib/engine", () => ({
  getEngineDescription: () => Promise.resolve("civ-core 0.1.0"),
  simulateMatchInBrowser: (_seed: Uint8Array, botsYaml: string[]): Promise<SimulationResult> => {
    simulation.calls.push(botsYaml);
    const turns = [10, 20, 30].map((yours) => {
      const counts = [yours, ...botsYaml.slice(1).map(() => 5)];
      return { tiles: tilesOwnedBy(counts), civs: counts.map(civ) };
    });
    return Promise.resolve({ turns, yourRuleCounts: [4, 0, 2, 0, 0, 0, 0], fingerprint: "1234" });
  },
}));

describe("SimulatorPage", () => {
  it("plays the match from turn 0 like a video, and steps through it when paused", async () => {
    renderWithProviders(<SimulatorPage />);

    expect(await screen.findByRole("img", { name: /^Map at turn 0: .* 10 tiles/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    await userEvent.click(screen.getByRole("button", { name: "Next turn" }));
    await userEvent.click(screen.getByRole("button", { name: "Next turn" }));

    expect(screen.getByRole("img", { name: /^Map at turn 2: .* 30 tiles/ })).toBeInTheDocument();
    expect(screen.getByText(/fingerprint 1234/)).toBeInTheDocument();
    expect(screen.getByText(/^Rule 1 .* fired 4 times$/)).toBeInTheDocument();
    expect(screen.getByText(/^Rule 2 .* never fired$/)).toBeInTheDocument();
  });

  it("plays only the opponents that are switched on when run again", async () => {
    renderWithProviders(<SimulatorPage />);
    await screen.findByRole("img", { name: /^Map at turn \d+/ });

    const [raider] = screen.getAllByRole("checkbox"); // red-raider is the first opponent
    if (raider !== undefined) await userEvent.click(raider);
    await userEvent.click(screen.getByRole("button", { name: "Run 120 turns" }));

    expect(simulation.calls.at(-1)).toHaveLength(3);
  });

  it("flags a seed that isn't hex", async () => {
    renderWithProviders(<SimulatorPage />);
    const seed = screen.getByLabelText("Map seed");

    await userEvent.clear(seed);
    await userEvent.type(seed, "not hex");
    await userEvent.click(screen.getByRole("button", { name: "Run 120 turns" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("invalid seed");
  });
});
