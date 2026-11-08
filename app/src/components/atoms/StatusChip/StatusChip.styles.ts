import styled from "styled-components";
import type { DefaultTheme } from "styled-components";

export type ChipTone = "positive" | "pending" | "neutral" | "negative";

const toneColors: Record<ChipTone, (theme: DefaultTheme) => { color: string }> = {
  positive: (theme) => ({ color: theme.colors.successText }),
  pending: (theme) => ({ color: theme.colors.warning }),
  neutral: (theme) => ({ color: theme.colors.textMuted }),
  negative: (theme) => ({ color: theme.colors.dangerText }),
};

export const StyledStatusChip = styled.span<{ $tone: ChipTone }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.space(0.75)} ${theme.space(2.5)}`};
  /* Drawn as an outlined, handwritten tag in the tone's colour, not a filled pill. */
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borderWidths.thin} solid currentColor;
  background: transparent;
  color: ${({ theme, $tone }) => toneColors[$tone](theme).color};
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 1.1;
  white-space: nowrap;
`;
