import styled from "styled-components";
import { OWNED_TILE_ALPHA, withAlpha } from "../../../theme";
import type { CivIndex, UnitKind } from "../../../types/game";

/** The board: black paper inside a chalk-white, hand-drawn frame. */
export const Grid = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.space(2.5)};
  display: grid;
  grid-template-columns: repeat(16, minmax(0, 1fr));
  gap: 2px;
  border-radius: ${({ theme }) => theme.radii.board};
  background: ${({ theme }) => theme.colors.bg};
  border: ${({ theme }) => theme.borderWidths.pen} solid ${({ theme }) => theme.colors.sketchLine};
`;

/** One tile: tinted in its owner's colour; a faint grid line, or a yellow ring when contested. */
export const TileCell = styled.div<{ $owner: CivIndex | null; $isContested: boolean }>`
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.tile};
  background: ${({ theme, $owner }) =>
    $owner === null ? "transparent" : withAlpha(theme.civColors[$owner], OWNED_TILE_ALPHA)};
  box-shadow: ${({ theme, $isContested }) =>
    $isContested ? `inset 0 0 0 2px ${theme.colors.highlight}` : `inset 0 0 0 1px ${theme.colors.mapGridLine}`};
`;

/** Deposits sit small in the top-right corner so a unit or city can share the tile. */
export const DepositSlot = styled.span`
  position: absolute;
  top: 4%;
  right: 4%;
  width: 44%;
  height: 44%;
`;

export const CitySlot = styled.span<{ $isSite: boolean }>`
  width: ${({ $isSite }) => ($isSite ? "62%" : "86%")};
  height: ${({ $isSite }) => ($isSite ? "62%" : "86%")};
`;

/** Each unit kind's share of the tile, from the design (the star needs more room to read). */
const UNIT_SIZE_PERCENT: Record<UnitKind, number> = { infantry: 72, guard: 70, siege: 76, elite: 80 };

export const UnitSlot = styled.span<{ $kind: UnitKind }>`
  position: relative;
  width: ${({ $kind }) => UNIT_SIZE_PERCENT[$kind]}%;
  height: ${({ $kind }) => UNIT_SIZE_PERCENT[$kind]}%;
`;
