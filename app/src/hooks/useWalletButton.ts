// The props for the WalletButton molecule, wired to the connected wallet: short address, balance,
// translated labels and the "open wallet picker" action. Used by the top bar and the home page,
// which both show the same wallet pill.

import type { WalletButtonProps } from "../components/molecules";
import { useI18nContext } from "../i18n";
import { initialsFor, shortenAddress } from "../model/format";
import { profilePath } from "../routes/paths";
import { useOpenWalletPicker, useWalletBalance, useWalletStatus } from "./useWallet";

/** Everything WalletButton needs, for the wallet connected right now (or none). */
export function useWalletButton(): WalletButtonProps {
  const { LL } = useI18nContext();
  const wallet = useWalletStatus();
  const balance = useWalletBalance();
  const openWalletPicker = useOpenWalletPicker();

  const shortAddress = wallet.address === null ? null : shortenAddress(wallet.address);
  const balanceText = balance.data === undefined ? LL.wallet.balanceLoading() : LL.sol({ amount: balance.data });
  return {
    address: shortAddress,
    balanceText,
    initials: initialsFor(wallet.address ?? ""),
    profilePath: profilePath(wallet.address ?? ""),
    connectLabel: LL.wallet.connect(),
    profileLabel: LL.wallet.connected({ address: shortAddress ?? "", balance: balanceText }),
    onConnect: openWalletPicker,
  };
}
