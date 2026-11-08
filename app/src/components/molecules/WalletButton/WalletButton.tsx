// The connect / disconnect wallet button. Wraps the wallet adapter's ready-made button so the rest
// of the app imports our component, not the library. It only opens the wallet modal; it makes no
// RPC calls, so it stays within the "components never talk to Solana" rule.

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { ReactElement } from "react";

/** Shows "Select Wallet" when disconnected, or the connected address with a disconnect menu. */
export function WalletButton(): ReactElement {
  return <WalletMultiButton />;
}
