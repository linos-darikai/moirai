// Map hooks: the real starting map from civ-core (WASM), and the board at a given turn.

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import { generateStartingMap } from "../lib/engine";
import { seedBytesFromHex } from "../model/map";
import { previewBoardAtTurn } from "../model/territoryPreview";
import type { BoardState, MapTile } from "../types/map";

/** civ-core's starting map for a seed (hex text) and number of civs. Errors if the seed isn't hex. */
export function useStartingMap(seedHex: string, civCount: number): UseQueryResult<MapTile[]> {
  return useQuery({
    queryKey: ["startingMap", seedHex, civCount],
    queryFn: () => {
      const seed = seedBytesFromHex(seedHex);
      if (seed === null) {
        throw new Error("invalid seed");
      }
      return generateStartingMap(seed, civCount);
    },
    staleTime: Infinity, // the same seed always gives the same map
    retry: false,
  });
}

/** What the map board shows at one turn, plus loading and error state of the starting map. */
export type BoardAtTurn = {
  board: BoardState | null;
  isPending: boolean;
  error: Error | null;
};

/**
 * The board at `turn`. Deposits and cities are civ-core's real starting map; territory growth
 * over turns is a PREVIEW (model/territoryPreview) until civ-core's turn function exists.
 */
export function useBoardAtTurn(seedHex: string, turn: number, civCount = 4): BoardAtTurn {
  const startingMap = useStartingMap(seedHex, civCount);
  const board = useMemo(
    () => (startingMap.data === undefined ? null : previewBoardAtTurn(startingMap.data, turn)),
    [startingMap.data, turn],
  );
  return { board, isPending: startingMap.isPending, error: startingMap.error };
}
