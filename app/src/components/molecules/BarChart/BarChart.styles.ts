import styled from "styled-components";
import { resolveColor } from "../../../theme/resolveColor";
import type { ColorToken as SwatchColor } from "../../../types/colors";


export const Plot = styled.div<{ $height: "sm" | "md" }>`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(1.5)};
  height: ${({ $height }) => ($height === "sm" ? "140px" : "180px")};
  padding-bottom: ${({ theme }) => theme.space(1)};
  border-bottom: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.borderStrong};
`;

export const Group = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 100%;
`;

export const Bar = styled.span<{ $percent: number; $color: SwatchColor }>`
  flex: 1;
  height: ${({ $percent }) => $percent}%;
  border-radius: 2px 2px 0 0;
  background: ${({ theme, $color }) => resolveColor(theme, $color)};
`;

export const Axis = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(1.5)};
  padding-top: ${({ theme }) => theme.space(1)};
`;

export const AxisLabel = styled.span`
  flex: 1;
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
