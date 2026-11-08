import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

export type ButtonVariant = "primary" | "secondary" | "subtle" | "success";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, (theme: DefaultTheme) => ReturnType<typeof css>> = {
  /* Filled with chalk, like the selected language on the home page. */
  primary: (theme) => css`
    background: ${theme.colors.sketchLine};
    color: ${theme.colors.bg};
    border-color: ${theme.colors.sketchLine};
    &:hover {
      background: ${theme.colors.text};
      color: ${theme.colors.bg};
    }
  `,
  /* A chalk outline, like the home page's Play button. */
  secondary: (theme) => css`
    background: transparent;
    color: ${theme.colors.text};
    border-color: ${theme.colors.sketchLine};
    &:hover {
      background: ${theme.colors.surfaceRaised};
      color: ${theme.colors.text};
    }
  `,
  /* A pencil-grey outline for less important actions. */
  subtle: (theme) => css`
    background: transparent;
    color: ${theme.colors.text};
    border-color: ${theme.colors.border};
    &:hover {
      border-color: ${theme.colors.sketchLine};
      color: ${theme.colors.text};
    }
  `,
  /* A green pen outline: "claim", "verified" and other good outcomes. */
  success: (theme) => css`
    background: transparent;
    color: ${theme.colors.successText};
    border-color: ${theme.colors.success};
    &:hover {
      background: ${theme.colors.successBg};
      color: ${theme.colors.successText};
    }
  `,
};

const sizeStyles: Record<ButtonSize, (theme: DefaultTheme) => ReturnType<typeof css>> = {
  sm: (theme) => css`
    min-height: 40px;
    padding: 0 ${theme.space(4)};
    border-radius: ${theme.radii.md};
  `,
  md: (theme) => css`
    min-height: ${theme.sizes.control};
    padding: 0 ${theme.space(5)};
    border-radius: ${theme.radii.lg};
  `,
  lg: (theme) => css`
    min-height: ${theme.sizes.controlLarge};
    padding: 0 ${theme.space(6)};
    border-radius: ${theme.radii.xl};
  `,
  icon: (theme) => css`
    width: ${theme.sizes.touchTarget};
    height: ${theme.sizes.touchTarget};
    padding: 0;
    border-radius: ${theme.radii.lg};
  `,
};

export const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $isFullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space(2)};
  width: ${({ $isFullWidth }) => ($isFullWidth ? "100%" : "auto")};
  border: ${({ theme }) => theme.borderWidths.sketch} solid transparent;
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => `calc(${theme.fontSizes.base} * ${theme.handScale})`};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: none;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
  ${({ theme, $variant }) => variantStyles[$variant](theme)}
  ${({ theme, $size }) => sizeStyles[$size](theme)}

  /* Disabled: a dashed pencil outline, so it reads as "not ready yet" rather than greyed out. */
  &:disabled {
    background: transparent;
    border-color: ${({ theme }) => theme.colors.border};
    border-style: dashed;
    color: ${({ theme }) => theme.colors.disabledText};
    cursor: not-allowed;
  }
`;
