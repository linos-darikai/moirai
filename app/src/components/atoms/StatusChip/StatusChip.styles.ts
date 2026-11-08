import styled from "styled-components";
import type { DefaultTheme } from "styled-components";

export type ChipTone = "positive" | "pending" | "neutral" | "negative";

const toneColors: Record<ChipTone, (theme: DefaultTheme) => { background: string; color: string }> = {
  positive: (theme) => ({ background: theme.colors.successBg, color: theme.colors.successText }),
  pending: (theme) => ({ background: theme.colors.warningBg, color: theme.colors.warning }),
  neutral: (theme) => ({ background: theme.colors.neutralChipBg, color: theme.colors.textMuted }),
  negative: (theme) => ({ background: theme.colors.dangerBg, color: theme.colors.dangerText }),
};

export const StyledStatusChip = styled.span<{ $tone: ChipTone }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.space(0.75)} ${theme.space(2.5)}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $tone }) => toneColors[$tone](theme).background};
  color: ${({ theme, $tone }) => toneColors[$tone](theme).color};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  white-space: nowrap;
`;
