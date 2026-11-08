// UnitShape atom: a unit's hand-drawn silhouette (PLAN.md section 2): infantry = triangle,
// guard = square, siege = tall rectangle, elite = star. Decorative; the count or name beside it
// is the content.

import type { ReactElement } from "react";
import type { CivIndex, UnitKind } from "../../../types/game";
import { UNIT_PATHS } from "./unitPaths";
import { StyledUnitShape } from "./UnitShape.styles";

type UnitShapeProps = {
  kind: UnitKind;
  civ: CivIndex;
  /** Height in px. Leave it out to fill the parent (the map sizes units as a share of a tile). */
  size?: number;
};

/** One unit's shape in its civ's colour. */
export function UnitShape({ kind, civ, size }: UnitShapeProps): ReactElement {
  const paths = UNIT_PATHS[kind];
  // The strokes use "currentColor", and the styled svg sets `color` to the civ's colour.
  return (
    <StyledUnitShape viewBox="0 0 20 20" aria-hidden="true" $civ={civ} $size={size ?? null}>
      <path d={paths.outline} fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d={paths.secondPass} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <path d={paths.hatching} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
    </StyledUnitShape>
  );
}
