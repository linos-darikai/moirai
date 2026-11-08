// TopNav organism: logo, main navigation, devnet badge, language picker and wallet button.
// Shown on every page (by the app layout route). On phones the links move to MobileNav.

import type { ReactElement } from "react";
import { useLanguage, useWalletButton } from "../../../hooks";
import { LANGUAGE_INFO, SUPPORTED_LANGUAGES, useI18nContext } from "../../../i18n";
import type { Locales } from "../../../i18n";
import { SAMPLE_LIVE_MATCH_ID, matchPath, paths } from "../../../routes/paths";
import { LogoMark } from "../../atoms";
import { LanguagePicker, WalletButton } from "../../molecules";
import { Actions, Bar, Brand, BrandName, NetworkBadge, NavItem, NavLinks } from "./TopNav.styles";

/** The app's top bar. */
export function TopNav(): ReactElement {
  const { LL } = useI18nContext();
  const { language, setLanguage } = useLanguage();
  const walletButton = useWalletButton();
  const languageOptions = SUPPORTED_LANGUAGES.map((code) => ({
    value: code,
    label: LANGUAGE_INFO[code].isDraft
      ? `${LANGUAGE_INFO[code].nativeName} (${LL.language.draft()})`
      : LANGUAGE_INFO[code].nativeName,
  }));

  return (
    <Bar>
      <Brand to={paths.home} aria-label={LL.nav.homeLink()}>
        <LogoMark size="small" />
        <BrandName>{LL.appName()}</BrandName>
      </Brand>
      <NavLinks aria-label={LL.nav.main()}>
        <NavItem to={paths.home} end>
          {LL.nav.lobbies()}
        </NavItem>
        <NavItem to={paths.editor}>{LL.nav.policies()}</NavItem>
        <NavItem to={paths.simulator}>{LL.nav.simulator()}</NavItem>
        <NavItem to={matchPath(SAMPLE_LIVE_MATCH_ID)}>{LL.nav.matches()}</NavItem>
        <NavItem to={paths.leaderboard}>{LL.nav.leaderboard()}</NavItem>
        <NavItem to={paths.rules}>{LL.nav.rules()}</NavItem>
      </NavLinks>
      <Actions>
        <NetworkBadge>{LL.network.devnet()}</NetworkBadge>
        <LanguagePicker
          label={LL.language.label()}
          value={language}
          options={languageOptions}
          onChange={(value) => setLanguage(value as Locales)}
        />
        <WalletButton {...walletButton} />
      </Actions>
    </Bar>
  );
}
