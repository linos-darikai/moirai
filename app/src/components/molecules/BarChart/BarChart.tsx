// BarChart molecule: grouped vertical bars (territory per civ over turns; Elo per match). The
// chart is one image to screen readers, described by `label`, since the bars themselves can't
// be read.

import type { ReactElement } from "react";
import type { SwatchColor } from "../../atoms";
import { Axis, AxisLabel, Bar, Group, Plot } from "./BarChart.styles";

export type BarGroup = {
  key: string;
  /** Text under the group, e.g. "t10". Omit for unlabelled bars. */
  axisLabel?: string;
  bars: readonly { value: number; color: SwatchColor }[];
};

type BarChartProps = {
  /** Plain-language summary of what the chart shows. */
  label: string;
  groups: readonly BarGroup[];
  /** Value of a full-height bar. */
  max: number;
  /** Value at the bottom of the chart (0 unless the data sits in a narrow band, like Elo). */
  min?: number;
  height?: "sm" | "md";
};

/** Bars grouped side by side. */
export function BarChart({ label, groups, max, min = 0, height = "sm" }: BarChartProps): ReactElement {
  const range = Math.max(1, max - min);
  const hasAxis = groups.some((group) => group.axisLabel !== undefined);
  return (
    <div>
      <Plot role="img" aria-label={label} $height={height}>
        {groups.map((group) => (
          <Group key={group.key}>
            {group.bars.map((bar, index) => (
              <Bar key={index} $percent={Math.max(0, ((bar.value - min) / range) * 100)} $color={bar.color} />
            ))}
          </Group>
        ))}
      </Plot>
      {hasAxis && (
        <Axis aria-hidden="true">
          {groups.map((group) => (
            <AxisLabel key={group.key}>{group.axisLabel}</AxisLabel>
          ))}
        </Axis>
      )}
    </div>
  );
}
