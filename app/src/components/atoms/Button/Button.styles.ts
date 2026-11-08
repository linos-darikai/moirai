import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

export type ButtonVariant = "primary" | "secondary" | "subtle" | "success";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, (theme: DefaultTheme) => ReturnType<typeof css>> = {
  primary: (theme) => css`
    background: ${theme.colors.accent};
    color: ${theme.colors.onAccent};
    border-color: ${theme.colors.accent};
    &:hover {
      background: ${theme.colors.accentHover};
      color: ${theme.colors.onAccent};
    }
  `,
  secondary: (theme) => css`
    background: transparent;
    color: ${theme.colors.text};
    border-color: ${theme.colors.borderStrong};
    &:hover {
      background: ${theme.colors.surfaceRaised};
      color: ${theme.colors.text};
    }
  `,
  subtle: (theme) => css`
    background: ${theme.colors.surfaceRaised};
    color: ${theme.colors.text};
    border-color: ${theme.colors.borderStrong};
    &:hover {
      border-color: ${theme.colors.accent};
      color: ${theme.colors.text};
    }
  `,
  success: (theme) => css`
    background: ${theme.colors.success};
    color: ${theme.colors.onAccent};
    border-color: ${theme.colors.success};
    &:hover {
      color: ${theme.colors.onAccent};
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
  border: 1px solid transparent;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-decoration: none;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
  ${({ theme, $variant }) => variantStyles[$variant](theme)}
  ${({ theme, $size }) => sizeStyles[$size](theme)}

  &:disabled {
    background: ${({ theme }) => theme.colors.disabledBg};
    border-color: ${({ theme }) => theme.colors.disabledBg};
    color: ${({ theme }) => theme.colors.disabledText};
    cursor: not-allowed;
  }
`;
