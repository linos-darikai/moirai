// Wallet hooks: connection status, opening the wallet picker, and the wallet's SOL balance.
// Components get wallet data only through these (they never import the wallet adapter).

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

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

/** Returns a function that opens the "select a wallet" modal. */
export function useOpenWalletPicker(): () => void {
  const { setVisible } = useWalletModal();
  return () => setVisible(true);
}

/** The connected wallet's balance in SOL. Disabled until a wallet is connected. */
export function useWalletBalance(): UseQueryResult<number> {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  return useQuery({
    queryKey: ["balance", publicKey?.toBase58()],
    enabled: publicKey !== null,
    queryFn: async () => {
      if (publicKey === null) throw new Error("Connect a wallet first");
      const lamports = await connection.getBalance(publicKey);
      return lamports / LAMPORTS_PER_SOL;
    },
    refetchInterval: 30_000,
  });
}
