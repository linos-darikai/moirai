// Data hooks for the hello-world Counter (Phase 0 connection check): read the connected wallet's
// Counter, and send `initialize` / `increment` to the deployed civ program.

import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { createCivProgram, findCounterAddress } from "../lib/solana";

/** What the app knows about a wallet's Counter account. */
export type CounterState = {
  /** The Counter PDA's address (base58). */
  address: string;
  /** The current count, or null if the Counter hasn't been created yet. */
  count: number | null;
};

/** Which counter instruction to send. */
export type CounterAction = "initialize" | "increment";

const counterQueryKey = (wallet: string | undefined) => ["counter", wallet] as const;

/** Reads the connected wallet's Counter. Disabled (no data) until a wallet is connected. */
export function useCounter(): UseQueryResult<CounterState> {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useQuery({
    queryKey: counterQueryKey(wallet?.publicKey.toBase58()),
    enabled: wallet !== undefined,
    queryFn: async (): Promise<CounterState> => {
      if (wallet === undefined) {
        throw new Error("Connect a wallet first");
      }
      const program = createCivProgram(connection, wallet);
      const address = findCounterAddress(wallet.publicKey);

      // `fetchNullable` returns null instead of throwing when the account doesn't exist yet.
      const counter = await program.account.counter.fetchNullable(address);

      return {
        address: address.toBase58(),
        count: counter === null ? null : counter.count.toNumber(),
      };
    },
  });
}

/** Sends `initialize` or `increment`, then refreshes the Counter. Resolves to the tx signature. */
export function useCounterAction(): UseMutationResult<string, Error, CounterAction> {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: CounterAction): Promise<string> => {
      if (wallet === undefined) {
        throw new Error("Connect a wallet first");
      }
      const program = createCivProgram(connection, wallet);

      // Anchor fills in the accounts itself: `authority` is the wallet, and the Counter PDA is
      // derived from the seeds recorded in the IDL.
      if (action === "initialize") {
        return program.methods.initialize().rpc();
      }
      return program.methods.increment().rpc();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: counterQueryKey(wallet?.publicKey.toBase58()),
      });
    },
  });
}
