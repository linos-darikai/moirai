import styled from "styled-components";
import type { CivIndex } from "../../../types/game";

/** `$size` null = fill the parent; a number = that many px square. */
export const StyledUnitShape = styled.svg<{ $civ: CivIndex; $size: number | null }>`
  flex: 0 0 auto;
  display: block;
  width: ${({ $size }) => ($size === null ? "100%" : `${$size}px`)};
  height: ${({ $size }) => ($size === null ? "100%" : `${$size}px`)};
  color: ${({ theme, $civ }) => theme.civColors[$civ]};
`;
