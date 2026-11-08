// MobileNav organism: the bottom tab bar on phones (Lobbies, Policies, Matches, Ranks). Hidden
// from tablet width up, where TopNav shows the links.

import type { ReactElement } from "react";
import { useI18nContext } from "../../../i18n";
import { SAMPLE_LIVE_MATCH_ID, matchPath, paths } from "../../../routes/paths";
import { Icon } from "../../atoms";
import { Bar, Tab } from "./MobileNav.styles";

/** Bottom navigation for small screens. */
export function MobileNav(): ReactElement {
  const { LL } = useI18nContext();
  return (
    <Bar aria-label={LL.nav.main()}>
      <Tab to={paths.home} end>
        <Icon name="grid" size={22} />
        {LL.nav.lobbies()}
      </Tab>
      <Tab to={paths.editor}>
        <Icon name="code" size={22} />
        {LL.nav.policies()}
      </Tab>
      <Tab to={matchPath(SAMPLE_LIVE_MATCH_ID)}>
        <Icon name="playCircle" size={22} />
        {LL.nav.matches()}
      </Tab>
      <Tab to={paths.leaderboard}>
        <Icon name="bars" size={22} />
        {LL.nav.ranks()}
      </Tab>
    </Bar>
  );
}
