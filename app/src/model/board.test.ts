import { describe, expect, it } from "vitest";
import type { MapTile } from "../types/map";
import { boardFromTiles } from "./board";

function tile(x: number, owner: MapTile["owner"]): MapTile {
  return { x, y: 0, owner, deposit: null, isCity: false, isCitySite: false };
}

describe("boardFromTiles", () => {
  it("counts each civ's tiles", () => {
    const board = boardFromTiles([tile(0, 0), tile(1, 0), tile(2, 2), tile(3, null)]);

    expect(board.tilesByCiv).toEqual({ 0: 2, 1: 0, 2: 1, 3: 0 });
    expect(board.tiles).toHaveLength(4);
  });

  it("draws a marching army in its own civ's colour, even on enemy land", () => {
    const board = boardFromTiles([tile(0, 0), tile(1, 2)], [{ civ: 0, x: 1, y: 0 }]);

    expect(board.tiles[1]).toMatchObject({ owner: 2, unit: "infantry", unitCiv: 0 });
    expect(board.tiles[0]?.unit).toBeNull();
  });
});
