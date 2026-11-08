// Building the map board from a real map (a civ-core snapshot): every tile plus how many tiles
// each civ owns. Pure: no React, no WASM.

import type { CivIndex } from "../types/game";
import type { BoardState, MapTile } from "../types/map";

/** The board for a map as civ-core produced it. Units aren't placed on tiles in v1. */
export function boardFromTiles(tiles: readonly MapTile[]): BoardState {
  const tilesByCiv: Record<CivIndex, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const boardTiles = tiles.map((tile) => {
    if (tile.owner !== null) tilesByCiv[tile.owner] += 1;
    return { ...tile, isContested: false, unit: null };
  });
  return { tiles: boardTiles, tilesByCiv };
}
