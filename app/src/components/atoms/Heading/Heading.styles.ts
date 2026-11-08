import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

/**
 * display = home hero, hero = results "X wins", h1 = page title, h2 = smaller page title
 * (match, editor), h3 = section title, card = panel title, eyebrow = small caps label.
 * Every size except eyebrow is handwritten (Caveat), like the sketchbook design.
 */
export type HeadingSize = "display" | "hero" | "h1" | "h2" | "h3" | "card" | "eyebrow";

const sizeStyles: Record<HeadingSize, (theme: DefaultTheme) => ReturnType<typeof css>> = {
  display: (theme) => css`
    font-size: ${theme.fontSizes.handHero};
    line-height: 0.9;
    letter-spacing: 0.02em;
  `,
  hero: (theme) => css`
    font-size: ${theme.fontSizes.handWin};
    line-height: ${theme.lineHeights.tight};
  `,
  h1: (theme) => css`
    font-size: ${theme.fontSizes.handPage};
    line-height: ${theme.lineHeights.tight};
  `,
  h2: (theme) => css`
    font-size: ${theme.fontSizes.handTitle};
    line-height: ${theme.lineHeights.tight};
  `,
  h3: (theme) => css`
    font-size: ${theme.fontSizes.handSection};
    line-height: ${theme.lineHeights.snug};
  `,
  card: (theme) => css`
    font-size: ${theme.fontSizes.handPanel};
    line-height: ${theme.lineHeights.snug};
  `,
  eyebrow: (theme) => css`
    font-family: ${theme.fonts.body};
    font-size: ${theme.fontSizes.sm};
    font-weight: ${theme.fontWeights.semibold};
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${theme.colors.textMuted};
  `,
};

export const StyledHeading = styled.h2<{ $size: HeadingSize }>`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.hand};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: inherit;
  ${({ theme, $size }) => sizeStyles[$size](theme)}
`;
