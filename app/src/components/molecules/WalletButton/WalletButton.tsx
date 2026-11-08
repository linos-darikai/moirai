// WalletButton molecule: "Connect wallet" when disconnected; when connected, a pill with an
// avatar, the short address and the SOL balance, linking to the player's profile.

import type { ReactElement } from "react";
import { Swatch } from "../../atoms";
import { Address, Balance, ConnectButton, Details, ProfilePill } from "./WalletButton.styles";

type WalletButtonProps = {
  /** Short wallet address, or null when no wallet is connected. */
  address: string | null;
  /** Formatted balance ("4.82 SOL"), or a placeholder while it loads. */
  balanceText: string;
  /** Two letters for the avatar. */
  initials: string;
  /** Where the connected pill links to (the player's profile). */
  profilePath: string;
  connectLabel: string;
  /** Accessible name of the connected pill, e.g. "Your profile, wallet 7xKq…3fPa, 4.82 SOL". */
  profileLabel: string;
  onConnect: () => void;
};

/** Connect button or connected-wallet pill. */
export function WalletButton({
  address,
  balanceText,
  initials,
  profilePath,
  connectLabel,
  profileLabel,
  onConnect,
}: WalletButtonProps): ReactElement {
  if (address === null) {
    return (
      <ConnectButton type="button" onClick={onConnect}>
        {connectLabel}
      </ConnectButton>
    );
  }
  return (
    <ProfilePill to={profilePath} aria-label={profileLabel}>
      <Swatch color={{ civ: 0 }} size="avatar" shape="round">
        {initials}
      </Swatch>
      <Details>
        <Address>{address}</Address>
        <Balance>{balanceText}</Balance>
      </Details>
    </ProfilePill>
  );
}
