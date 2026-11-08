// UnitShape atom: a unit's silhouette (PLAN.md section 2): infantry = triangle, guard = square,
// siege = tall rectangle, elite = star. Decorative; the count or name beside it is the content.

import type { ReactElement } from "react";
import type { CivIndex, UnitKind } from "../../../types/game";
import { StyledUnitShape } from "./UnitShape.styles";

type UnitShapeProps = {
  kind: UnitKind;
  civ: CivIndex;
  /** Height in px (the shape scales from it). */
  size?: number;
};

/** One unit's shape in its civ's colour. */
export function UnitShape({ kind, civ, size = 12 }: UnitShapeProps): ReactElement {
  return <StyledUnitShape aria-hidden="true" $kind={kind} $civ={civ} $size={size} />;
}
