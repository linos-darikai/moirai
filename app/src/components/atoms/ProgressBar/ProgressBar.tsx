// ProgressBar atom: a thin bar showing how far along something is (match turns, win rate).

import type { ReactElement } from "react";
import type { ColorToken as SwatchColor } from "../../../types/colors";
import { Fill, Track } from "./ProgressBar.styles";

type ProgressBarProps = {
  value: number;
  max: number;
  /** Accessible name. Without it the bar is decorative (the number is shown in text nearby). */
  label?: string;
  color?: SwatchColor;
  height?: "thin" | "regular";
};

/** A horizontal fill bar. */
export function ProgressBar({ value, max, label, color = { token: "accent" }, height = "thin" }: ProgressBarProps): ReactElement {
  const percent = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  if (label === undefined) {
    return (
      <Track aria-hidden="true" $height={height}>
        <Fill $percent={percent} $color={color} />
      </Track>
    );
  }
  return (
    <Track role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} $height={height}>
      <Fill $percent={percent} $color={color} />
    </Track>
  );
}
