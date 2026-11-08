// Heading atom: h1–h4 in handwriting (Caveat), sized from the sketchbook type scale.

import type { ReactElement, ReactNode } from "react";
import { StyledHeading } from "./Heading.styles";
import type { HeadingSize } from "./Heading.styles";

type HeadingProps = {
  children: ReactNode;
  /** The HTML level (1 = page title). Pick it for document structure, not looks. */
  level: 1 | 2 | 3 | 4;
  /** Visual size; defaults to a size that fits the level. */
  size?: HeadingSize;
  id?: string;
};

const DEFAULT_SIZE: Record<HeadingProps["level"], HeadingSize> = { 1: "h1", 2: "h3", 3: "card", 4: "eyebrow" };

/** A section or page title. */
export function Heading({ children, level, size, id }: HeadingProps): ReactElement {
  const tag = `h${level}` as const;
  return (
    <StyledHeading as={tag} id={id} $size={size ?? DEFAULT_SIZE[level]}>
      {children}
    </StyledHeading>
  );
}
