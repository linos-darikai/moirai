// PageContainer template: centres a page's content at a maximum width with the page padding and
// the vertical gap between its sections.

import type { ReactElement, ReactNode } from "react";
import { Container } from "./PageContainer.styles";
import type { PageGap, PageWidth } from "./PageContainer.styles";

type PageContainerProps = {
  children: ReactNode;
  /** narrow = 1280 px (most pages), medium = 1360 (simulator), wide = 1440 (editor, match). */
  width?: PageWidth;
  gap?: PageGap;
};

/** The centred column a page lives in. */
export function PageContainer({ children, width = "narrow", gap = "lg" }: PageContainerProps): ReactElement {
  return (
    <Container $width={width} $gap={gap}>
      {children}
    </Container>
  );
}
