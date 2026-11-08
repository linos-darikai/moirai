// AppShell template: the frame of every page. Slots for the top bar, a notice banner, the page,
// the footer and the phone tab bar. Layout only: it shows whatever it is given.

import type { ReactElement, ReactNode } from "react";
import { Banner, Footer, Main, Shell } from "./AppShell.styles";

type AppShellProps = {
  header: ReactNode;
  /** A thin notice above the page (e.g. "this is sample data"). */
  banner?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Bottom navigation shown on phones. */
  bottomNav?: ReactNode;
};

/** The page frame. */
export function AppShell({ header, banner, children, footer, bottomNav }: AppShellProps): ReactElement {
  return (
    <Shell>
      {header}
      {banner !== undefined && <Banner role="note">{banner}</Banner>}
      <Main id="main">{children}</Main>
      {footer !== undefined && <Footer>{footer}</Footer>}
      {bottomNav}
    </Shell>
  );
}
