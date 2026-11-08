// MapBoard organism: the 16 x 16 board. Every page that shows a map uses this one component, so
// Simulator, Live match, Replay, Results and mobile all draw the same board the same way.
// The board is one image to screen readers, described by a per-civ tile summary. Tiles are drawn
// in the sketchbook style: pencil circles for deposits, a spiral for cities, sketched units.
// As turns play, land fades to its new owner and units slide from tile to tile (no motion for
// viewers who prefer reduced motion).

import type { ReactElement } from "react";
import { useI18nContext } from "../../../i18n";
import type { CivIndex } from "../../../types/game";
import type { BoardState, BoardTile } from "../../../types/map";
import { SketchMark, UnitShape } from "../../atoms";
import { QueryStatus } from "../../molecules";
import { CitySlot, DepositSlot, Grid, TileCell, UnitLayer, UnitToken } from "./MapBoard.styles";

type MapBoardProps = {
  board: BoardState | null;
  isPending: boolean;
  error: Error | null;
  turn: number;
  /** Display name of each civ, for the screen-reader summary. */
  civNames: Readonly<Record<CivIndex, string>>;
};

const CIVS: readonly CivIndex[] = [0, 1, 2, 3];

/** Every unit on the board with a key that stays the same from turn to turn (its civ, and its
 * place among that civ's units), so React keeps the same element and it slides to its new tile. */
function unitsOnBoard(tiles: readonly BoardTile[]): { key: string; tile: BoardTile; civ: CivIndex }[] {
  const countByCiv: Record<CivIndex, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const units: { key: string; tile: BoardTile; civ: CivIndex }[] = [];
  for (const tile of tiles) {
    if (tile.unit === null || tile.unitCiv === null) continue;
    const civ = tile.unitCiv;
    units.push({ key: `${civ}-${countByCiv[civ]}`, tile, civ });
    countByCiv[civ] += 1;
  }
  return units;
}

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
          {tile.deposit !== null && !tile.isCity && (
            <DepositSlot>
              <SketchMark kind="deposit" tone={{ resource: tile.deposit }} />
            </DepositSlot>
          )}
          {tile.isCitySite && !tile.isCity && (
            <CitySlot $isSite>
              <SketchMark kind="citySite" tone="muted" />
            </CitySlot>
          )}
          {tile.isCity && tile.owner !== null && (
            <CitySlot $isSite={false}>
              <SketchMark kind="city" tone={{ civ: tile.owner }} />
            </CitySlot>
          )}
        </TileCell>
      ))}
      <UnitLayer aria-hidden="true">
        {unitsOnBoard(board.tiles).map(({ key, tile, civ }) => (
          <UnitToken key={key} $x={tile.x} $y={tile.y} $kind={tile.unit ?? "infantry"}>
            <UnitShape kind={tile.unit ?? "infantry"} civ={civ} />
          </UnitToken>
        ))}
      </UnitLayer>
    </Grid>
  );
}
