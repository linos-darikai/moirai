// Test fixtures: plain Match views (types/chain.ts) for page tests that mock lib/solana's reads.

import type { MatchAccountView } from "../types/chain";

/** Deadlines in these fixtures are relative to the real clock, so countdowns stay in the future. */
const now = (): number => Math.floor(Date.now() / 1000);

export const WALLET_ALICE = "A1iceWa11etAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
export const WALLET_BOB = "BobWa11etBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

/** An open 2-seat lobby nobody has joined yet; override what a test needs. */
export function openMatch(overrides: Partial<MatchAccountView> = {}): MatchAccountView {
  return {
    address: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    creator: WALLET_ALICE,
    players: [],
    maxPlayers: 2,
    entryFeeLamports: 10_000_000,
    joinDeadline: now() + 600,
    commitDeadline: now() + 1_200,
    revealDeadline: now() + 1_800,
    seedRequestedAt: 0,
    status: "open",
    winMetric: "territory",
    payout: "winnerTakesAll",
    committed: [],
    revealed: [],
    commitments: [],
    turn: 0,
    vaultLamports: 890_880,
    ...overrides,
  };
}
