import styled from "styled-components";
import { resolveColor } from "../../../theme/resolveColor";
import { withAlpha } from "../../../theme/tokens";
import type { ColorToken } from "../../../types/colors";

/** Which colour token to use (see types/colors). */
export type SwatchColor = ColorToken;
export type SwatchSize = "xs" | "sm" | "md" | "lg" | "xl" | "avatar" | "profile";
export type SwatchShape = "square" | "round";

const sizePx: Record<SwatchSize, number> = { xs: 8, sm: 12, md: 24, lg: 32, xl: 44, avatar: 32, profile: 88 };

/** Swatches this small (in px) are filled solid; bigger ones are an outline over a wash. */
const SOLID_MAX_PX = 12;
/** Opacity of the wash inside a bigger swatch, as a 2-digit hex alpha (0x73 is about 45%). */
const SWATCH_WASH_ALPHA = "73";


export const StyledSwatch = styled.span<{ $color: SwatchColor; $size: SwatchSize; $shape: SwatchShape }>`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => sizePx[$size]}px;
  height: ${({ $size }) => sizePx[$size]}px;
  /* Drawn like the units on the home page: a pen outline in the colour over a light wash of it.
     Tiny swatches (dots in lists) stay solid so the colour is still easy to see. */
  border-radius: ${({ theme, $shape }) => ($shape === "round" ? "50%" : theme.radii.tile)};
  border: ${({ theme }) => theme.borderWidths.pen} solid ${({ theme, $color }) => resolveColor(theme, $color)};
  background: ${({ theme, $color, $size }) =>
    sizePx[$size] <= SOLID_MAX_PX ? resolveColor(theme, $color) : withAlpha(resolveColor(theme, $color), SWATCH_WASH_ALPHA)};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ $size }) => Math.round(sizePx[$size] * 0.38)}px;
`;
