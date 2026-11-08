import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

export type SurfaceTone = "default" | "raised" | "inset" | "highlight" | "win" | "verify" | "warning" | "sketch";
export type SurfacePadding = "none" | "sm" | "md" | "lg" | "xl";

const toneStyles: Record<SurfaceTone, (theme: DefaultTheme) => ReturnType<typeof css>> = {
  /* A chalk-outlined panel drawn on the paper, like the home page's panels. */
  default: (theme) => css`
    background: transparent;
    border-color: ${theme.colors.sketchLine};
    border-radius: ${theme.radii.sketchPanel};
  `,
  /* A smaller box inside a panel: pencil-grey outline so it doesn't compete with the panel. */
  raised: (theme) => css`
    background: transparent;
    border-color: ${theme.colors.border};
    border-radius: ${theme.radii.xl};
  `,
  /* A dashed pencil box: code, logs and other "inside" areas. */
  inset: (theme) => css`
    background: transparent;
    border-color: ${theme.colors.border};
    border-style: dashed;
    border-radius: ${theme.radii.xl};
  `,
  /* Drawn with the highlighter instead of chalk. */
  highlight: (theme) => css`
    background: transparent;
    border-color: ${theme.colors.highlight};
    border-radius: ${theme.radii.sketchPanel};
  `,
  win: (theme) => css`
    background: transparent;
    border-color: ${theme.colors.actionText};
    border-radius: ${theme.radii.hero};
  `,
  verify: (theme) => css`
    background: transparent;
    border-color: ${theme.colors.successText};
    border-radius: ${theme.radii.card};
  `,
  warning: (theme) => css`
    background: transparent;
    border-color: ${theme.colors.highlight};
    border-radius: ${theme.radii.xl};
    color: ${theme.colors.warningText};
  `,
  /* No fill, chalk-white pen outline: the hand-drawn panels on the home page. */
  sketch: (theme) => css`
    background: transparent;
    border-color: ${theme.colors.sketchLine};
    border-width: ${theme.borderWidths.pen};
    border-radius: ${theme.radii.sketchPanel};
  `,
};

const paddingSteps: Record<SurfacePadding, number> = { none: 0, sm: 3, md: 4, lg: 6, xl: 8 };

export const StyledSurface = styled.div<{
  $tone: SurfaceTone;
  $padding: SurfacePadding;
  $isSelected: boolean;
}>`
  margin: 0;
  min-width: 0;
  border: ${({ theme }) => theme.borderWidths.sketch} solid;
  padding: ${({ theme, $padding }) => theme.space(paddingSteps[$padding])};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  ${({ theme, $tone }) => toneStyles[$tone](theme)}
  ${({ theme, $isSelected }) =>
    $isSelected &&
    css`
      border-color: ${theme.colors.highlight};
    `}
`;
