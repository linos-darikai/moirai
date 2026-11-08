// MapBoard organism: the 16 x 16 board. Every page that shows a map uses this one component, so
// Simulator, Live match, Replay, Results and mobile all draw the same board the same way.
// The board is one image to screen readers, described by a per-civ tile summary.

import type { ReactElement } from "react";
import { useI18nContext } from "../../../i18n";
import type { CivIndex } from "../../../types/game";
import type { BoardState } from "../../../types/map";
import { QueryStatus } from "../../molecules";
import { CityMark, DepositDot, Grid, TileCell, UnitMark } from "./MapBoard.styles";

type MapBoardProps = {
  board: BoardState | null;
  isPending: boolean;
  error: Error | null;
  turn: number;
  /** Display name of each civ, for the screen-reader summary. */
  civNames: Readonly<Record<CivIndex, string>>;
};

const CIVS: readonly CivIndex[] = [0, 1, 2, 3];

/** The map at one turn. */
export function MapBoard({ board, isPending, error, turn, civNames }: MapBoardProps): ReactElement {
  const { LL } = useI18nContext();

  if (error !== null) {
    return <QueryStatus kind="error" text={LL.states.error({ message: error.message })} />;
  }
  if (isPending || board === null) {
    return <QueryStatus kind="loading" text={LL.states.loading()} />;
  }

  const summary = CIVS.map((civ) => LL.map.civTiles({ name: civNames[civ], count: board.tilesByCiv[civ] })).join(", ");

  return (
    <Grid role="img" aria-label={LL.map.label({ turn, summary })}>
      {board.tiles.map((tile) => (
        <TileCell key={`${tile.x}-${tile.y}`} $owner={tile.owner} $isContested={tile.isContested}>
          {tile.deposit !== null && !tile.isCity && <DepositDot $resource={tile.deposit} />}
          {tile.isCity && tile.owner !== null && <CityMark $civ={tile.owner} />}
          {tile.unit !== null && tile.owner !== null && <UnitMark $civ={tile.owner} $kind={tile.unit} />}
        </TileCell>
      ))}
    </Grid>
  );
}
