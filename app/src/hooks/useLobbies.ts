// Lobby hooks: open lobbies and one lobby, read from the civ program on devnet, plus the actions
// a player takes in a lobby (create, join, commit, reveal, start, play, settle, cancel).

import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { compilePolicyDraft } from "../lib/engine";
import {
  TOTAL_TURNS,
  advanceOneTurn,
  cancelMatch,
  commitPolicy,
  createCivProgram,
  createMatch,
  fetchMatch,
  fetchOpenMatches,
  joinMatch,
  retryMatchSeed,
  revealPolicy,
  settleMatch,
  startMatch,
} from "../lib/solana";
import type { NewMatchSettings } from "../lib/solana";
import { policyCommitment, randomSalt } from "../model/commitment";
import { lobbySummaryFromMatch } from "../model/lobbyFromMatch";
import type { MatchAccountView } from "../types/chain";
import type { LobbySummary, WinMetric } from "../types/game";
import { fromHex, loadCommitment, saveCommitment, toHex } from "./savedCommitments";

/** How often an open lobby page refreshes from the chain. */
const LOBBY_REFRESH_MS = 3_000;
const LOBBIES_REFRESH_MS = 15_000;

const lobbiesKey = ["lobbies"] as const;
const lobbyKey = (address: string) => ["lobby", address] as const;

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Open lobbies on chain, optionally only those with one win metric. */
export function useLobbies(metric: WinMetric | "all"): UseQueryResult<LobbySummary[]> {
  const { connection } = useConnection();
  return useQuery({
    queryKey: lobbiesKey,
    queryFn: async () => (await fetchOpenMatches(connection)).map((match) => lobbySummaryFromMatch(match, nowSeconds())),
    select: (lobbies: LobbySummary[]) => (metric === "all" ? lobbies : lobbies.filter((lobby) => lobby.metric === metric)),
    refetchInterval: LOBBIES_REFRESH_MS,
  });
}

/** One match by its address, refreshed every few seconds. `null` once it is settled or cancelled. */
export function useLobby(address: string): UseQueryResult<MatchAccountView | null> {
  const { connection } = useConnection();
  return useQuery({
    queryKey: lobbyKey(address),
    queryFn: () => fetchMatch(connection, address),
    refetchInterval: LOBBY_REFRESH_MS,
  });
}

/** Opens a new lobby; resolves to its address. */
export function useCreateLobby(): UseMutationResult<string, Error, NewMatchSettings> {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: NewMatchSettings) => {
      if (wallet === undefined) return Promise.reject(new Error("Connect a wallet first"));
      return createMatch(createCivProgram(connection, wallet), settings);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lobbiesKey }),
  });
}

/** One thing a player (or anyone) can do in a lobby. `commit` carries the policy to commit. */
export type LobbyActionRequest =
  | { kind: "join" | "reveal" | "start" | "retrySeed" | "play" | "settle" | "cancel" }
  | { kind: "commit"; policyName: string; policyYaml: string };

/** Sends lobby actions for one match, then refreshes it. */
export function useLobbyAction(match: MatchAccountView | null): UseMutationResult<void, Error, LobbyActionRequest> {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: LobbyActionRequest) => {
      if (match === null) throw new Error("This match no longer exists");
      if (wallet === undefined) throw new Error("Connect a wallet first");
      const program = createCivProgram(connection, wallet);
      const walletAddress = wallet.publicKey.toBase58();
      switch (request.kind) {
        case "join":
          await joinMatch(program, match.address);
          return;
        case "commit":
          await commitDraft(program, match.address, walletAddress, request.policyName, request.policyYaml);
          return;
        case "reveal": {
          const saved = loadCommitment(match.address, walletAddress);
          if (saved === null) throw new Error("This browser doesn't have your commitment's secret salt, so it can't reveal");
          await revealPolicy(program, match.address, fromHex(saved.policyHex), fromHex(saved.saltHex));
          return;
        }
        case "start":
          await startMatch(program, match.address);
          return;
        case "retrySeed":
          await retryMatchSeed(program, match.address);
          return;
        case "play":
          // Plays every remaining turn, one transaction each; the page shows the turn as it refreshes.
          for (let turn = match.turn; turn < TOTAL_TURNS; turn++) {
            await advanceOneTurn(program, connection, match.address);
            await queryClient.invalidateQueries({ queryKey: lobbyKey(match.address) });
          }
          return;
        case "settle":
          await settleMatch(program, match.address, match.players);
          return;
        case "cancel":
          await cancelMatch(program, match.address, match.players);
          return;
      }
    },
    onSettled: async () => {
      if (match === null) return;
      await queryClient.invalidateQueries({ queryKey: lobbyKey(match.address) });
      await queryClient.invalidateQueries({ queryKey: lobbiesKey });
    },
  });
}

/** Compiles the draft with civ-core (WASM), makes a salt, saves the secret here, then commits. */
async function commitDraft(
  program: ReturnType<typeof createCivProgram>,
  match: string,
  wallet: string,
  policyName: string,
  policyYaml: string,
): Promise<void> {
  const compiled = await compilePolicyDraft(policyYaml);
  if (!compiled.isValid) throw new Error(`“${policyName}” doesn't compile yet: fix it in the editor first`);
  const salt = randomSalt();
  const isSaved = saveCommitment(match, wallet, { policyHex: toHex(compiled.bytes), saltHex: toHex(salt), policyName });
  if (!isSaved) throw new Error("This browser can't store your commitment's salt (private window?), so you couldn't reveal later");
  await commitPolicy(program, match, await policyCommitment(compiled.bytes, salt));
}

/** The policy this browser committed for a match, if it has the secret. */
export function useSavedCommitment(match: string, wallet: string | null): string | null {
  if (wallet === null) return null;
  return loadCommitment(match, wallet)?.policyName ?? null;
}
