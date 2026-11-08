import styled from "styled-components";
import type { CivIndex, UnitKind } from "../../../types/game";

/** The outline of each unit kind, as a CSS clip-path. */
export const UNIT_CLIP_PATH: Record<UnitKind, string> = {
  infantry: "polygon(50% 0%, 100% 100%, 0% 100%)",
  guard: "inset(0%)",
  siege: "inset(0% 25% 0% 25%)",
  elite: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
};

export const StyledUnitShape = styled.span<{ $kind: UnitKind; $civ: CivIndex; $size: number }>`
  flex: 0 0 auto;
  display: inline-block;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  background: ${({ theme, $civ }) => theme.civColors[$civ]};
  clip-path: ${({ $kind }) => UNIT_CLIP_PATH[$kind]};
`;
