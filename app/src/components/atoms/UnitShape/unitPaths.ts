// The hand-drawn outline of each unit kind, as SVG path data on a 20 x 20 canvas (PLAN.md
// section 2: infantry = triangle, guard = square, siege = tall rectangle, elite = star).
// Copied from the sketchbook design. Each shape is three strokes: the outline, a second wobbly
// pass over the edges (so it looks drawn twice by hand), and pencil hatching inside.

import type { UnitKind } from "../../../types/game";

/** The three strokes that draw one unit shape. */
export type UnitPaths = {
  outline: string;
  secondPass: string;
  hatching: string;
};

export const UNIT_PATHS: Record<UnitKind, UnitPaths> = {
  infantry: {
    outline: "M10.2 2.4C12.5 6.8 15.1 11.9 17.7 16.9C12.6 17.4 7.6 17.1 2.4 17.3C4.9 12.4 7.4 7.3 10.2 2.4Z",
    secondPass: "M9.6 3.2C7.4 7.9 5 12.2 3 16.6M10.8 3.4C13 7.6 15.2 12 17.1 16.1M3.4 16.6C8 16.3 12.6 16.6 17.6 16.4",
    hatching: "M8.4 9.6L11.6 8M6.6 13L13.4 10.4M5.2 15.8L15 12.6",
  },
  guard: {
    outline: "M3.1 3.4C8 2.9 12.3 3.2 16.8 3C17.1 7.9 16.9 12.2 17.2 16.9C12.4 17.2 7.8 16.8 2.9 17.1C3.2 12.4 2.8 7.9 3.1 3.4Z",
    secondPass:
      "M2.4 3.9C7.4 3.5 12.6 3.7 17.6 3.5M16.4 2.4C16.6 7.6 16.3 12.6 16.6 17.6M17.4 16.4C12.4 16.6 7.4 16.3 2.4 16.5M3.7 17.4C3.5 12.4 3.8 7.4 3.5 2.6",
    hatching: "M4.6 8.2L8.4 4.6M4.6 12.6L12.8 4.8M5.2 15.8L15.8 5.6M9.4 15.8L15.6 9.8",
  },
  siege: {
    outline: "M6.6 4.2C9 4.1 11.2 4.4 13.4 4.1C13.6 8.8 13.3 13.4 13.6 18C11.2 18.2 9 17.9 6.4 18.1C6.7 13.4 6.3 8.9 6.6 4.2Z",
    secondPass:
      "M6.6 4.2L6.5 1.8L8.9 1.9L9 4.1M11 4.2L11.1 1.9L13.4 2L13.4 4.1M7.2 4.8C7 9 7.3 13.6 7 17.4M12.9 4.6C13.1 9 12.8 13.4 13.1 17.6",
    hatching: "M7.8 8.4L12.4 6.8M7.6 12L12.6 10.2M7.6 15.6L12.4 13.8",
  },
  elite: {
    outline: "M10 1.8L12.3 7.5L18.3 7.4L13.5 11.3L15.3 17.6L10.1 14L4.7 17.8L6.6 11.4L1.7 7.8L7.9 7.2Z",
    secondPass: "M9.6 2.6L7.4 7.8L2.6 8.2M17.6 8L13 11.6L14.8 16.8M5.4 17L7.2 11.8",
    hatching: "M8.6 9.4L11.6 8.6M7.8 12.2L12.6 10.8M9 13.6L11.4 13",
  },
};
