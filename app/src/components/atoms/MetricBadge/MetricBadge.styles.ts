import styled from "styled-components";
import type { WinMetric } from "../../../types/game";

export const StyledMetricBadge = styled.span<{ $metric: WinMetric }>`
  display: inline-block;
  align-self: flex-start;
  padding: ${({ theme }) => `${theme.space(0.75)} ${theme.space(2)}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $metric }) => theme.metricColors[$metric]};
  color: ${({ theme }) => theme.colors.onAccent};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;
