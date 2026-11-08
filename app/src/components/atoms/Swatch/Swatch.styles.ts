import styled from "styled-components";
import type { DefaultTheme } from "styled-components";
import type { CivIndex, ResourceKind } from "../../../types/game";

/** Which colour token to use. */
export type SwatchColor =
  | { civ: CivIndex }
  | { avatar: number }
  | { resource: ResourceKind }
  | { token: "accent" | "success" | "empty" };
export type SwatchSize = "xs" | "sm" | "md" | "lg" | "xl" | "avatar" | "profile";
export type SwatchShape = "square" | "round";

const sizePx: Record<SwatchSize, number> = { xs: 8, sm: 12, md: 24, lg: 32, xl: 44, avatar: 32, profile: 88 };

function colorFor(theme: DefaultTheme, color: SwatchColor): string {
  if ("civ" in color) return theme.civColors[color.civ];
  if ("avatar" in color) return theme.avatarColors[color.avatar % theme.avatarColors.length] ?? theme.colors.accent;
  if ("resource" in color) return theme.resourceColors[color.resource];
  if (color.token === "accent") return theme.colors.accent;
  if (color.token === "success") return theme.colors.success;
  return theme.colors.border;
}

export const StyledSwatch = styled.span<{ $color: SwatchColor; $size: SwatchSize; $shape: SwatchShape }>`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => sizePx[$size]}px;
  height: ${({ $size }) => sizePx[$size]}px;
  border-radius: ${({ $shape, $size }) => ($shape === "round" ? "50%" : `${Math.round(sizePx[$size] / 4)}px`)};
  background: ${({ theme, $color }) => colorFor(theme, $color)};
  color: ${({ theme }) => theme.colors.onAccent};
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ $size }) => Math.round(sizePx[$size] * 0.38)}px;
`;
