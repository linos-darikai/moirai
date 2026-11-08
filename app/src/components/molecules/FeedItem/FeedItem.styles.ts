import styled, { css } from "styled-components";
import { resolveColor } from "../../../theme/resolveColor";
import type { ColorToken as SwatchColor } from "../../../types/colors";


export const Line = styled.li<{ $look: "plain" | "boxed" }>`
  display: flex;
  gap: ${({ theme }) => theme.space(2.5)};
  font-size: ${({ theme }) => theme.fontSizes.md};
  ${({ theme, $look }) =>
    $look === "boxed" &&
    css`
      padding: ${theme.space(2.5)} ${theme.space(3)};
      border-radius: ${theme.radii.xl};
      background: ${theme.colors.surface};
    `}
`;

export const Turn = styled.span`
  flex: 0 0 34px;
  padding-top: 2px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Bar = styled.span<{ $color: SwatchColor }>`
  flex: 0 0 4px;
  border-radius: 2px;
  background: ${({ theme, $color }) => resolveColor(theme, $color)};
`;

export const Words = styled.span`
  color: ${({ theme }) => theme.colors.textFeed};
`;
