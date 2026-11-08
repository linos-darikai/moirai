// Columns template: side-by-side regions that wrap into one column on narrow screens, like the
// design's layouts. Two regions (main + side) or three (start + main + end).

import type { ReactElement, ReactNode } from "react";
import { Region, Row } from "./Columns.styles";
import type { RegionSize } from "./Columns.styles";

type ColumnsProps = {
  main: ReactNode;
  /** A side column before the main one (policy list, civ list, simulator setup). */
  start?: ReactNode;
  /** A side column after the main one (summary, entry panel, feed). */
  end?: ReactNode;
  /** How wide the side columns are allowed to get. */
  sideSize?: RegionSize;
  /** The main column's largest width (e.g. keep the map from getting huge). */
  mainMaxWidth?: "map" | "none";
  /** stretch = equal heights (hero rows); start = each as tall as its content. */
  align?: "start" | "stretch";
};

/** Responsive columns. */
export function Columns({ main, start, end, sideSize = "md", mainMaxWidth = "none", align = "start" }: ColumnsProps): ReactElement {
  return (
    <Row $align={align}>
      {start !== undefined && <Region $role="side" $size={sideSize}>{start}</Region>}
      <Region $role="main" $size={sideSize} $mainMaxWidth={mainMaxWidth}>
        {main}
      </Region>
      {end !== undefined && <Region $role="side" $size={sideSize}>{end}</Region>}
    </Row>
  );
}
