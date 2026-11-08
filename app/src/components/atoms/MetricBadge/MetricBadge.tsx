// MetricBadge atom: the coloured tag naming a lobby's win metric (Territory, Wealth, ...).

import type { ReactElement } from "react";
import type { WinMetric } from "../../../types/game";
import { StyledMetricBadge } from "./MetricBadge.styles";

type MetricBadgeProps = {
  metric: WinMetric;
  /** The translated metric name. */
  label: string;
};

/** A small uppercase tag in the metric's colour. */
export function MetricBadge({ metric, label }: MetricBadgeProps): ReactElement {
  return <StyledMetricBadge $metric={metric}>{label}</StyledMetricBadge>;
}
