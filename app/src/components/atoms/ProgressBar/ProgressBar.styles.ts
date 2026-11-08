import styled from "styled-components";
import { resolveColor } from "../../../theme/resolveColor";
import type { ColorToken as SwatchColor } from "../../../types/colors";


export const Track = styled.div<{ $height: "thin" | "regular" }>`
  width: 100%;
  height: ${({ $height }) => ($height === "thin" ? "8px" : "10px")};
  border-radius: ${({ theme }) => theme.radii.tile};
  border: ${({ theme }) => theme.borderWidths.thin} solid ${({ theme }) => theme.colors.border};
  background: transparent;
  overflow: hidden;
`;

export const Fill = styled.div<{ $percent: number; $color: SwatchColor }>`
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  background: ${({ theme, $color }) => resolveColor(theme, $color)};
`;
