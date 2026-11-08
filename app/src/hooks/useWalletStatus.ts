// Data hook for the connected wallet, so pages don't import the wallet adapter directly.

import { useWallet } from "@solana/wallet-adapter-react";

/** Whether a wallet is connected, and its address (base58) if so. */
export type WalletStatus = {
  isConnected: boolean;
  address: string | null;
};

/** Returns the current wallet connection status. */
export function useWalletStatus(): WalletStatus {
  const { connected, publicKey } = useWallet();
  return {
    isConnected: connected,
    address: publicKey === null ? null : publicKey.toBase58(),
  };
}
