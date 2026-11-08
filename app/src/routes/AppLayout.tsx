// The layout routes around every page. AppLayout: the AppShell template filled with the top bar,
// the sample-data notice, the footer and the phone tab bar. HomeLayout: the hand-drawn home page
// draws its own header and footer, so it only keeps the phone tab bar. Pages render into <Outlet />.

import type { ReactElement } from "react";
import { Outlet } from "react-router";
import { Text } from "../components/atoms";
import { MobileNav, TopNav } from "../components/organisms";
import { AppShell } from "../components/templates";
import { useI18nContext } from "../i18n";
import { CIV_PROGRAM_ID } from "../lib/solana";

/** Frames every route with navigation and footer. */
export function AppLayout(): ReactElement {
  const { LL } = useI18nContext();
  return (
    <AppShell
      header={<TopNav />}
      banner={LL.preview.banner()}
      bottomNav={<MobileNav />}
      footer={
        <>
          <span>{LL.footer.devnetOnly()}</span>
          <span>
            {LL.footer.program()} <Text as="span" size="sm" isMono>{CIV_PROGRAM_ID.toBase58()}</Text>
          </span>
        </>
      }
    >
      <Outlet />
    </AppShell>
  );
}

/** Frames the home page: no top bar or footer (the page draws its own), just the phone tab bar. */
export function HomeLayout(): ReactElement {
  return (
    <AppShell bottomNav={<MobileNav />}>
      <Outlet />
    </AppShell>
  );
}
