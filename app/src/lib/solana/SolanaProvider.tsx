// Wraps the app in the wallet adapter's providers: the RPC connection, the connected wallet and
// the "select a wallet" modal. Wallets that support the Wallet Standard (Phantom, Solflare,
// Backpack, ...) are detected automatically, so the `wallets` list is empty.

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import type { ReactElement, ReactNode } from "react";
import { SOLANA_RPC_URL } from "./config";

// The wallet adapter's own stylesheet for its button and modal (the one library CSS we allow).
import "@solana/wallet-adapter-react-ui/styles.css";

type SolanaProviderProps = {
  children: ReactNode;
};

/** Provides the Solana connection and wallet context to everything inside it. */
export function SolanaProvider({ children }: SolanaProviderProps): ReactElement {
  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
