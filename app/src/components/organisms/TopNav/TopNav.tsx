// TopNav organism: logo, main navigation, devnet badge, language picker and wallet button.
// Shown on every page (by the app layout route). On phones the links move to MobileNav.

import type { ReactElement } from "react";
import { useLanguage, useOpenWalletPicker, useWalletBalance, useWalletStatus } from "../../../hooks";
import { LANGUAGE_INFO, SUPPORTED_LANGUAGES, useI18nContext } from "../../../i18n";
import type { Locales } from "../../../i18n";
import { initialsFor, shortenAddress } from "../../../model/format";
import { SAMPLE_LIVE_MATCH_ID, matchPath, paths, profilePath } from "../../../routes/paths";
import { LanguagePicker, WalletButton } from "../../molecules";
import { Actions, Bar, Brand, BrandName, NetworkBadge, NavItem, NavLinks } from "./TopNav.styles";

/** The logo mark: three threads (the three Fates) in the resource colours. */
function MoiraiMark(): ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M3 8c4-4 8 4 11 0s7-4 11 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="thread-food" />
      <path d="M3 14c4-4 8 4 11 0s7-4 11 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="thread-gold" />
      <path d="M3 20c4-4 8 4 11 0s7-4 11 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="thread-ore" />
    </svg>
  );
}

/** The app's top bar. */
export function TopNav(): ReactElement {
  const { LL } = useI18nContext();
  const { language, setLanguage } = useLanguage();
  const wallet = useWalletStatus();
  const balance = useWalletBalance();
  const openWalletPicker = useOpenWalletPicker();

  const shortAddress = wallet.address === null ? null : shortenAddress(wallet.address);
  const balanceText = balance.data === undefined ? LL.wallet.balanceLoading() : LL.sol({ amount: balance.data });
  const languageOptions = SUPPORTED_LANGUAGES.map((code) => ({
    value: code,
    label: LANGUAGE_INFO[code].isDraft
      ? `${LANGUAGE_INFO[code].nativeName} (${LL.language.draft()})`
      : LANGUAGE_INFO[code].nativeName,
  }));

  return (
    <Bar>
      <Brand to={paths.home} aria-label={LL.nav.homeLink()}>
        <MoiraiMark />
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
        <WalletButton
          address={shortAddress}
          balanceText={balanceText}
          initials={initialsFor(wallet.address ?? "")}
          profilePath={profilePath(wallet.address ?? "")}
          connectLabel={LL.wallet.connect()}
          profileLabel={LL.wallet.connected({ address: shortAddress ?? "", balance: balanceText })}
          onConnect={openWalletPicker}
        />
      </Actions>
    </Bar>
  );
}
