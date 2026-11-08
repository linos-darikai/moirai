// Sending match instructions to the civ program, signed by the connected wallet. Each function is
// one step of a match: create, join, commit, reveal, start, play a turn, settle.
// docs/decisions/0009 has the flow; tests/devnet/full-match.ts runs the same calls end to end.

import { BN } from "@anchor-lang/core";
import { ComputeBudgetProgram, Connection, PublicKey } from "@solana/web3.js";
import type { CivProgram } from "./civProgram";
import { fetchTurn, findMatchAddress, findProfileAddress } from "./matchAccounts";
import type { PayoutKind, WinMetric } from "../../types/game";

/** MagicBlock's base-layer VRF queue for devnet and mainnet (ephemeral-vrf-sdk DEFAULT_QUEUE). */
const VRF_QUEUE = new PublicKey("Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh");
/** The CU limit for one turn: about 4.5 × the heaviest turn measured (docs/decisions/0009). */
const ADVANCE_TURN_COMPUTE_UNITS = 400_000;
/** A small priority fee so turns land on a busy devnet. */
const PRIORITY_FEE_MICRO_LAMPORTS = 10_000;
/** How many times one turn is sent before giving up. */
const MAX_TURN_ATTEMPTS = 5;
/** Turns in a match (civ-core TOTAL_TURNS). */
export const TOTAL_TURNS = 120;

const WIN_METRIC_BYTES: Record<WinMetric, number> = { territory: 0, wealth: 1, conquest: 2, score: 3 };
const PAYOUT_BYTES: Record<Exclude<PayoutKind, "practice">, number> = { winnerTakesAll: 0, topThree: 1 };

/** What the creator chooses for a new lobby. */
export type NewMatchSettings = {
  entryFeeLamports: number;
  maxPlayers: number;
  winMetric: WinMetric;
  payout: Exclude<PayoutKind, "practice">;
  /** Unix seconds. */
  joinDeadline: number;
  commitDeadline: number;
  revealDeadline: number;
};

/** Opens a lobby. Returns the new Match's address. */
export async function createMatch(program: CivProgram, settings: NewMatchSettings): Promise<string> {
  const creator = program.provider.publicKey;
  if (creator === undefined) throw new Error("Connect a wallet first");
  // The creator's number for this match; milliseconds are unique enough for one wallet.
  const matchId = BigInt(Date.now());
  await program.methods
    .createMatch(new BN(matchId.toString()), {
      entryFeeLamports: new BN(settings.entryFeeLamports),
      maxPlayers: settings.maxPlayers,
      winMetric: WIN_METRIC_BYTES[settings.winMetric],
      payout: PAYOUT_BYTES[settings.payout],
      joinDeadline: new BN(settings.joinDeadline),
      commitDeadline: new BN(settings.commitDeadline),
      revealDeadline: new BN(settings.revealDeadline),
    })
    .rpc();
  return findMatchAddress(creator, matchId).toBase58();
}

/** Joins a lobby, paying the entry fee (and creating the wallet's Profile on its first match). */
export function joinMatch(program: CivProgram, match: string): Promise<string> {
  const player = program.provider.publicKey;
  if (player === undefined) return Promise.reject(new Error("Connect a wallet first"));
  return program.methods.joinMatch().accounts({ player, matchAccount: new PublicKey(match) }).rpc();
}

/** Stores the commitment sha256(compiled policy || salt). */
export function commitPolicy(program: CivProgram, match: string, commitment: Uint8Array): Promise<string> {
  const player = program.provider.publicKey;
  if (player === undefined) return Promise.reject(new Error("Connect a wallet first"));
  return program.methods
    .commitPolicy(Array.from(commitment))
    .accounts({ player, matchAccount: new PublicKey(match) })
    .rpc();
}

/** Reveals the committed policy and its salt. */
export function revealPolicy(program: CivProgram, match: string, policy: Uint8Array, salt: Uint8Array): Promise<string> {
  const player = program.provider.publicKey;
  if (player === undefined) return Promise.reject(new Error("Connect a wallet first"));
  return program.methods
    .revealPolicy(Buffer.from(policy), Array.from(salt))
    .accounts({ player, matchAccount: new PublicKey(match) })
    .rpc();
}

/** Asks the VRF oracle for the map seed (the oracle then starts the game a few seconds later). */
export function startMatch(program: CivProgram, match: string): Promise<string> {
  return program.methods.startMatch().accountsPartial({ matchAccount: new PublicKey(match), oracleQueue: VRF_QUEUE }).rpc();
}

/** Asks the oracle again when it hasn't answered in time. */
export function retryMatchSeed(program: CivProgram, match: string): Promise<string> {
  return program.methods.retryMatchSeed().accountsPartial({ matchAccount: new PublicKey(match), oracleQueue: VRF_QUEUE }).rpc();
}

/**
 * Plays exactly one turn. Devnet sometimes drops a transaction; resending blindly could play two
 * turns if the first landed after all, so after a failure we re-read the turn and only send again
 * if it didn't move (docs/decisions/0009, "Devnet results").
 */
export async function advanceOneTurn(program: CivProgram, connection: Connection, match: string): Promise<void> {
  const matchKey = new PublicKey(match);
  const turnBefore = await fetchTurn(connection, matchKey);
  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_TURN_ATTEMPTS; attempt++) {
    try {
      await program.methods
        .advanceTurn()
        .accounts({ matchAccount: matchKey })
        .preInstructions([
          ComputeBudgetProgram.setComputeUnitLimit({ units: ADVANCE_TURN_COMPUTE_UNITS }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PRIORITY_FEE_MICRO_LAMPORTS }),
        ])
        .rpc();
      return;
    } catch (error) {
      lastError = error;
      if ((await fetchTurn(connection, matchKey)) > turnBefore) return; // it landed after all
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Turn ${turnBefore} failed`);
}

/** Settles a finished match: pays the pot and updates every player's Profile. */
export function settleMatch(program: CivProgram, match: string, players: readonly string[]): Promise<string> {
  const remainingAccounts = players.flatMap((player) => {
    const wallet = new PublicKey(player);
    return [
      { pubkey: wallet, isSigner: false, isWritable: true },
      { pubkey: findProfileAddress(wallet), isSigner: false, isWritable: true },
    ];
  });
  return program.methods.settleMatch().accounts({ matchAccount: new PublicKey(match) }).remainingAccounts(remainingAccounts).rpc();
}

/** Cancels a lobby that didn't fill by its join deadline: refunds every player and closes it. */
export function cancelMatch(program: CivProgram, match: string, players: readonly string[]): Promise<string> {
  const remainingAccounts = players.map((player) => ({ pubkey: new PublicKey(player), isSigner: false, isWritable: true }));
  return program.methods.cancelMatch().accounts({ matchAccount: new PublicKey(match) }).remainingAccounts(remainingAccounts).rpc();
}
