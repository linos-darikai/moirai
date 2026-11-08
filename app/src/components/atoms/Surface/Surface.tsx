// Surface atom: the rounded panel every card and section sits on.

import type { ReactElement, ReactNode } from "react";
import { StyledSurface } from "./Surface.styles";
import type { SurfacePadding, SurfaceTone } from "./Surface.styles";

type SurfaceProps = {
  children: ReactNode;
  /** default = card, raised = card on a card, inset = sunken, highlight = strong border,
   *  win / verify / warning = coloured callouts. */
  tone?: SurfaceTone;
  padding?: SurfacePadding;
  /** Which element to render (section for page sections, article for cards...). */
  as?: "div" | "section" | "article" | "aside" | "header" | "form" | "fieldset";
  /** Points at the heading that names this section, for screen readers. */
  labelledBy?: string;
  ariaLabel?: string;
  /** Show the accent border (e.g. "this is you"). */
  isSelected?: boolean;
};

/** A panel with background, border and rounded corners. */
export function Surface({
  children,
  tone = "default",
  padding = "lg",
  as = "div",
  labelledBy,
  ariaLabel,
  isSelected = false,
}: SurfaceProps): ReactElement {
  return (
    <StyledSurface
      as={as}
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      $tone={tone}
      $padding={padding}
      $isSelected={isSelected}
    >
      {children}
    </StyledSurface>
  );
}
