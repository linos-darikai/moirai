// Swatch atom: a small colour square or dot identifying a civ, player, resource or event.
// Decorative: the name next to it carries the meaning, so it is hidden from screen readers.

import type { ReactElement, ReactNode } from "react";
import { StyledSwatch } from "./Swatch.styles";
import type { SwatchColor, SwatchShape, SwatchSize } from "./Swatch.styles";

type SwatchProps = {
  color: SwatchColor;
  size?: SwatchSize;
  shape?: SwatchShape;
  /** Text inside (e.g. avatar initials). */
  children?: ReactNode;
};

/** A coloured square, rounded square or dot. */
export function Swatch({ color, size = "sm", shape = "square", children }: SwatchProps): ReactElement {
  return (
    <StyledSwatch aria-hidden="true" $color={color} $size={size} $shape={shape}>
      {children}
    </StyledSwatch>
  );
}
