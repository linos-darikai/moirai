// Building the map board from a real map (a civ-core snapshot): every tile, how many tiles each
// civ owns, and each army on the march drawn where it stands. Pure: no React, no WASM.

import type { CivIndex } from "../types/game";
import type { BoardState, BoardTile, MapTile } from "../types/map";

/** An army on the march: whose it is and where it stands. */
export type MarchingArmy = { civ: CivIndex; x: number; y: number };

/** The board for a map as civ-core produced it, with marching armies on their tiles. */
export function boardFromTiles(tiles: readonly MapTile[], armies: readonly MarchingArmy[] = []): BoardState {
  const tilesByCiv: Record<CivIndex, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const boardTiles: BoardTile[] = tiles.map((tile) => {
    if (tile.owner !== null) tilesByCiv[tile.owner] += 1;
    const army = armies.find((candidate) => candidate.x === tile.x && candidate.y === tile.y);
    return { ...tile, isContested: false, unit: army === undefined ? null : "infantry", unitCiv: army?.civ ?? null };
  });
  return { tiles: boardTiles, tilesByCiv };
}
