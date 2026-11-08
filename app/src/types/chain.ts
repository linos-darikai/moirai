// Plain views of on-chain accounts: numbers and strings only, no web3.js types, so model/ and
// components can use them. lib/solana converts the real accounts into these.

import type { PayoutKind, WinMetric } from "./game";

/** Where a match is in its life (programs/civ MatchStatus). */
export type MatchStatusName = "open" | "running" | "settled" | "cancelled" | "seedRequested";

/** One Match account, as the app needs it. */
export type MatchAccountView = {
  /** The Match account's address (base58). */
  address: string;
  creator: string;
  /** Wallets that joined, in seat order. */
  players: string[];
  maxPlayers: number;
  entryFeeLamports: number;
  /** Unix seconds. */
  joinDeadline: number;
  commitDeadline: number;
  revealDeadline: number;
  /** Unix seconds the map seed was last requested (0 = never). */
  seedRequestedAt: number;
  status: MatchStatusName;
  winMetric: WinMetric;
  payout: PayoutKind;
  /** Per seat: has this player committed / revealed? */
  committed: boolean[];
  revealed: boolean[];
  /** Per seat: the commitment as hex ("" = none). */
  commitments: string[];
  /** The turn the game is on (0 until it starts). */
  turn: number;
  /** Lamports in the match's vault right now. */
  vaultLamports: number;
};
