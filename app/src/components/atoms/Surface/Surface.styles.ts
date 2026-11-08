import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

export type SurfaceTone = "default" | "raised" | "inset" | "highlight" | "win" | "verify" | "warning";
export type SurfacePadding = "none" | "sm" | "md" | "lg" | "xl";

const toneStyles: Record<SurfaceTone, (theme: DefaultTheme) => ReturnType<typeof css>> = {
  default: (theme) => css`
    background: ${theme.colors.surface};
    border-color: ${theme.colors.border};
    border-radius: ${theme.radii.card};
  `,
  raised: (theme) => css`
    background: ${theme.colors.surfaceRaised};
    border-color: ${theme.colors.border};
    border-radius: ${theme.radii.xl};
  `,
  inset: (theme) => css`
    background: ${theme.colors.inset};
    border-color: ${theme.colors.border};
    border-radius: ${theme.radii.xl};
  `,
  highlight: (theme) => css`
    background: ${theme.colors.surface};
    border-color: ${theme.colors.borderStrong};
    border-radius: ${theme.radii.card};
  `,
  win: (theme) => css`
    background: ${theme.colors.winBg};
    border-color: ${theme.colors.winBorder};
    border-radius: ${theme.radii.hero};
  `,
  verify: (theme) => css`
    background: ${theme.colors.verifyBg};
    border-color: ${theme.colors.verifyBorder};
    border-radius: ${theme.radii.card};
  `,
  warning: (theme) => css`
    background: ${theme.colors.warningBg};
    border-color: ${theme.colors.warningBorder};
    border-radius: ${theme.radii.xl};
    color: ${theme.colors.warningText};
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
  border: 1px solid;
  padding: ${({ theme, $padding }) => theme.space(paddingSteps[$padding])};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  ${({ theme, $tone }) => toneStyles[$tone](theme)}
  ${({ theme, $isSelected }) =>
    $isSelected &&
    css`
      border-color: ${theme.colors.accent};
    `}
`;
