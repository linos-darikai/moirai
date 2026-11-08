import styled from "styled-components";
import { OWNED_TILE_ALPHA, withAlpha } from "../../../theme";
import type { CivIndex, ResourceKind, UnitKind } from "../../../types/game";
import { UNIT_CLIP_PATH } from "../../atoms";

export const Grid = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.space(2)};
  display: grid;
  grid-template-columns: repeat(16, minmax(0, 1fr));
  gap: 2px;
  border-radius: ${({ theme }) => theme.radii.xxl};
  background: ${({ theme }) => theme.colors.inset};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const TileCell = styled.div<{ $owner: CivIndex | null; $isContested: boolean }>`
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.xs};
  background: ${({ theme, $owner }) =>
    $owner === null ? theme.colors.mapEmpty : withAlpha(theme.civColors[$owner], OWNED_TILE_ALPHA)};
  box-shadow: ${({ theme, $isContested }) => ($isContested ? `inset 0 0 0 2px ${theme.colors.warning}` : "none")};
`;

export const DepositDot = styled.span<{ $resource: ResourceKind }>`
  position: absolute;
  top: 12%;
  right: 12%;
  width: 24%;
  height: 24%;
  border-radius: 50%;
  background: ${({ theme, $resource }) => theme.resourceColors[$resource]};
`;

export const CityMark = styled.span<{ $civ: CivIndex }>`
  width: 62%;
  height: 62%;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 3px solid ${({ theme, $civ }) => theme.civColors[$civ]};
  background: ${({ theme }) => theme.colors.bg};
`;

/** An empty dashed square: a city could be built here. */
export const CitySiteMark = styled.span`
  width: 56%;
  height: 56%;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 2px dashed ${({ theme }) => theme.colors.textMuted};
`;

export const UnitMark = styled.span<{ $civ: CivIndex; $kind: UnitKind }>`
  width: 46%;
  height: 46%;
  background: ${({ theme, $civ }) => theme.civColors[$civ]};
  clip-path: ${({ $kind }) => UNIT_CLIP_PATH[$kind]};
`;
