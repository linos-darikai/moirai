// VisuallyHidden atom: text for screen readers only (e.g. a label for a search box whose
// purpose is clear visually).

import type { ReactElement, ReactNode } from "react";
import { HiddenSpan } from "./VisuallyHidden.styles";

type VisuallyHiddenProps = {
  children: ReactNode;
  /** Render a <label for=...> instead of a span. */
  htmlFor?: string;
};

/** Hidden on screen, read aloud by screen readers. */
export function VisuallyHidden({ children, htmlFor }: VisuallyHiddenProps): ReactElement {
  if (htmlFor !== undefined) {
    return (
      <HiddenSpan as="label" htmlFor={htmlFor}>
        {children}
      </HiddenSpan>
    );
  }
  return <HiddenSpan>{children}</HiddenSpan>;
}
