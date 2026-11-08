import { describe, expect, it } from "vitest";
import type { MapTile } from "../types/map";
import { boardFromTiles } from "./board";

function tile(owner: MapTile["owner"]): MapTile {
  return { x: 0, y: 0, owner, deposit: null, isCity: false, isCitySite: false };
}

describe("boardFromTiles", () => {
  it("counts each civ's tiles", () => {
    const board = boardFromTiles([tile(0), tile(0), tile(2), tile(null)]);

    expect(board.tilesByCiv).toEqual({ 0: 2, 1: 0, 2: 1, 3: 0 });
    expect(board.tiles).toHaveLength(4);
  });
});
