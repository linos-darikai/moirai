// The layout route around every page: the AppShell template filled with the top bar, the
// sample-data notice, the footer and the phone tab bar. Pages render into the <Outlet />.

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
