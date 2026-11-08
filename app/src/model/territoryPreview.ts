// PREVIEW ONLY: a stand-in for territory growth over turns, until civ-core's turn function exists
// (Phase 1). It starts from civ-core's real starting map (deposits and cities) and grows each civ
// outward from its city at a different speed. Replace with real turn states from civ-core.

import type { CivIndex } from "../types/game";
import { UNIT_KINDS } from "../types/game";
import type { BoardState, BoardTile, MapTile } from "../types/map";

/** How fast each civ spreads, in tiles of reach per 9 turns. Faster civs claim more. */
const GROWTH_SPEED: Record<CivIndex, number> = { 0: 1.5, 1: 1.15, 2: 0.85, 3: 1.3 };
const MAX_REACH = 12;
const CONTESTED_MARGIN = 0.12;

/** Builds the board at `turn` from the starting map. */
export function previewBoardAtTurn(startingTiles: readonly MapTile[], turn: number, showUnits = true): BoardState {
  const cities = startingTiles.filter((tile) => tile.isCity && tile.owner !== null);
  const tilesByCiv: Record<CivIndex, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };

  const tiles: BoardTile[] = startingTiles.map((tile) => {
    let owner: CivIndex | null = null;
    let best = Number.POSITIVE_INFINITY;
    let second = Number.POSITIVE_INFINITY;

    for (const city of cities) {
      const civ = city.owner as CivIndex;
      const reach = Math.min(MAX_REACH, 1 + Math.floor((turn * GROWTH_SPEED[civ]) / 9));
      const distance = Math.abs(tile.x - city.x) + Math.abs(tile.y - city.y);
      if (distance > reach) continue;
      const closeness = distance / reach;
      if (closeness < best) {
        second = best;
        best = closeness;
        owner = civ;
      } else if (closeness < second) {
        second = closeness;
      }
    }

    if (owner !== null) tilesByCiv[owner] += 1;
    const isContested = owner !== null && second - best < CONTESTED_MARGIN;
    const hasUnit = showUnits && owner !== null && !tile.isCity && (tile.x * 5 + tile.y * 3 + turn) % 11 === 0;
    return {
      ...tile,
      owner,
      isContested,
      unit: hasUnit ? (UNIT_KINDS[(tile.x + tile.y) % UNIT_KINDS.length] ?? null) : null,
      unitCiv: hasUnit ? owner : null,
    };
  });

  return { tiles, tilesByCiv };
}
