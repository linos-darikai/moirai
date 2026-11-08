import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { previewBoardAtTurn } from "../../../model/territoryPreview";
import { renderWithProviders } from "../../../test/renderWithProviders";
import type { MapTile } from "../../../types/map";
import { MapBoard } from "./MapBoard";

const civNames = { 0: "iron-turtle", 1: "red-raider", 2: "silk-trader", 3: "wide-expander" } as const;

/** An empty 16 x 16 map with one city per civ in the corners. */
function startingMap(): MapTile[] {
  const cities: Record<string, 0 | 1 | 2 | 3> = { "3,3": 0, "12,12": 1, "12,3": 2, "3,12": 3 };
  return Array.from({ length: 256 }, (_, index) => {
    const x = index % 16;
    const y = Math.floor(index / 16);
    const owner = cities[`${x},${y}`] ?? null;
    return { x, y, owner, deposit: null, isCity: owner !== null, isCitySite: owner !== null };
  });
}

describe("MapBoard", () => {
  it("draws 256 tiles and describes the board for screen readers", () => {
    const board = previewBoardAtTurn(startingMap(), 10);

    renderWithProviders(<MapBoard board={board} isPending={false} error={null} turn={10} civNames={civNames} />);

    const image = screen.getByRole("img");
    // 256 tiles, plus the unit layer (hidden from screen readers) where units slide.
    const tiles = Array.from(image.children).filter((child) => child.getAttribute("aria-hidden") !== "true");
    expect(tiles).toHaveLength(256);
    expect(image.getAttribute("aria-label")).toMatch(/^Map at turn 10: iron-turtle \d+ tiles/);
  });

  it("shows a loading state until the map exists", () => {
    renderWithProviders(<MapBoard board={null} isPending error={null} turn={0} civNames={civNames} />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
});
