import styled from "styled-components";
import { resolveColor } from "../../../theme/resolveColor";
import type { ColorToken } from "../../../types/colors";

/** Which colour token to use (see types/colors). */
export type SwatchColor = ColorToken;
export type SwatchSize = "xs" | "sm" | "md" | "lg" | "xl" | "avatar" | "profile";
export type SwatchShape = "square" | "round";

const sizePx: Record<SwatchSize, number> = { xs: 8, sm: 12, md: 24, lg: 32, xl: 44, avatar: 32, profile: 88 };


export const StyledSwatch = styled.span<{ $color: SwatchColor; $size: SwatchSize; $shape: SwatchShape }>`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => sizePx[$size]}px;
  height: ${({ $size }) => sizePx[$size]}px;
  border-radius: ${({ $shape, $size }) => ($shape === "round" ? "50%" : `${Math.round(sizePx[$size] / 4)}px`)};
  background: ${({ theme, $color }) => resolveColor(theme, $color)};
  color: ${({ theme }) => theme.colors.onAccent};
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ $size }) => Math.round(sizePx[$size] * 0.38)}px;
`;
