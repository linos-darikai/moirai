import { Link } from "react-router";
import styled from "styled-components";
import type { WinMetric } from "../../../types/game";

export const Row = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => `${theme.space(1.5)} ${theme.space(3.5)}`};
  padding: ${({ theme }) => theme.space(2.5)} 0;
  border-top: ${({ theme }) => theme.borderWidths.sketch} dashed ${({ theme }) => theme.colors.border};
`;

/** The win metric, handwritten in its badge colour. */
export const Metric = styled.span<{ $metric: WinMetric }>`
  min-width: 96px;
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.handPanel};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 1;
  color: ${({ theme, $metric }) => theme.metricColors[$metric]};
`;

export const Fee = styled.span`
  min-width: 76px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Seats = styled.span`
  display: flex;
  gap: ${({ theme }) => theme.space(1)};
`;

export const SeatSlot = styled.span`
  width: 16px;
  height: 16px;
`;

export const Closes = styled.span`
  flex: 1 1 90px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const JoinLink = styled(Link)`
  min-height: ${({ theme }) => theme.sizes.touchTarget};
  display: inline-flex;
  align-items: center;
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.handPanel};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: none;
`;
