import styled from "styled-components";
import type { DefaultTheme } from "styled-components";

export type TextSize = "xs" | "sm" | "md" | "base" | "lg" | "xl" | "xxl" | "h3" | "h2";
export type TextTone = "default" | "muted" | "soft" | "subtle" | "accent" | "success" | "warning" | "danger";

const toneColor: Record<TextTone, (theme: DefaultTheme) => string> = {
  default: (theme) => theme.colors.text,
  muted: (theme) => theme.colors.textMuted,
  soft: (theme) => theme.colors.textSoft,
  subtle: (theme) => theme.colors.textSubtle,
  accent: (theme) => theme.colors.accent,
  success: (theme) => theme.colors.successText,
  warning: (theme) => theme.colors.warning,
  danger: (theme) => theme.colors.dangerText,
};

export const StyledText = styled.p<{
  $size: TextSize;
  $tone: TextTone;
  $isMono: boolean;
  $isDisplay: boolean;
  $weight: "regular" | "medium" | "semibold" | "bold";
}>`
  margin: 0;
  /* Handwritten (display) text is scaled up so it reads as big as the body text around it. */
  font-size: ${({ theme, $size, $isDisplay }) =>
    $isDisplay ? `calc(${theme.fontSizes[$size]} * ${theme.handScale})` : theme.fontSizes[$size]};
  line-height: ${({ theme, $isDisplay }) => ($isDisplay ? theme.lineHeights.snug : "inherit")};
  font-weight: ${({ theme, $weight }) => theme.fontWeights[$weight]};
  color: ${({ theme, $tone }) => toneColor[$tone](theme)};
  font-family: ${({ theme, $isMono, $isDisplay }) =>
    $isMono ? theme.fonts.mono : $isDisplay ? theme.fonts.display : "inherit"};
  overflow-wrap: anywhere;
`;
