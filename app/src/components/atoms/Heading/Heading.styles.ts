import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

/** display = hero, h1 = page title, h2/h3 = section, card = panel title, eyebrow = small caps label. */
export type HeadingSize = "display" | "hero" | "h1" | "h2" | "h3" | "card" | "eyebrow";

const sizeStyles: Record<HeadingSize, (theme: DefaultTheme) => ReturnType<typeof css>> = {
  display: (theme) => css`
    font-size: ${theme.fontSizes.display};
    line-height: ${theme.lineHeights.tight};
    letter-spacing: -0.02em;
  `,
  hero: (theme) => css`
    font-size: ${theme.fontSizes.hero};
    line-height: ${theme.lineHeights.tight};
  `,
  h1: (theme) => css`
    font-size: ${theme.fontSizes.h1};
    line-height: ${theme.lineHeights.snug};
    letter-spacing: -0.01em;
  `,
  h2: (theme) => css`
    font-size: ${theme.fontSizes.h2};
    line-height: ${theme.lineHeights.snug};
  `,
  h3: (theme) => css`
    font-size: ${theme.fontSizes.xl};
    line-height: ${theme.lineHeights.snug};
  `,
  card: (theme) => css`
    font-size: ${theme.fontSizes.lg};
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
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: inherit;
  ${({ theme, $size }) => sizeStyles[$size](theme)}
`;
