// Turning an on-chain Match (types/chain.ts) into what the lobby pages show: the lobby card, the
// seats, the phase, and the next step for the connected wallet. Pure: no React, no Solana, so
// every rule here is unit-tested in lobbyFromMatch.test.ts.

import type { MatchAccountView } from "../types/chain";
import type { CivIndex, LobbySeat, LobbySummary } from "../types/game";
import { shortenAddress } from "./format";

/** Lamports in one SOL. */
const LAMPORTS_PER_SOL = 1_000_000_000;
/** Turns in a match (civ-core TOTAL_TURNS). */
export const MATCH_TURNS = 120;
/** programs/civ SEED_REQUEST_TIMEOUT_SECONDS: after this the seed may be requested again. */
export const SEED_REQUEST_TIMEOUT_SECONDS = 120;

/** The short label a lobby is shown with: "#" and the first 4 characters of its address. */
export function lobbyLabel(address: string): string {
  return `#${address.slice(0, 4)}`;
}

/** The lobby card on the home page. `id` is the Match address (used in the URL). */
export function lobbySummaryFromMatch(match: MatchAccountView, nowSeconds: number): LobbySummary {
  return {
    id: match.address,
    label: lobbyLabel(match.address),
    metric: match.winMetric,
    entryFeeSol: match.entryFeeLamports / LAMPORTS_PER_SOL,
    poolSol: (match.entryFeeLamports * match.players.length) / LAMPORTS_PER_SOL,
    turns: MATCH_TURNS,
    payout: match.entryFeeLamports === 0 ? "practice" : match.payout,
    joinedCount: match.players.length,
    seatCount: match.maxPlayers,
    closesInMinutes: Math.max(0, Math.ceil((match.joinDeadline - nowSeconds) / 60)),
  };
}

/** Every seat of the lobby, open ones included, from the connected wallet's point of view. */
export function lobbySeatsFromMatch(match: MatchAccountView, wallet: string | null): LobbySeat[] {
  const seats: LobbySeat[] = [];
  for (let seat = 0; seat < match.maxPlayers; seat++) {
    const player = match.players[seat] ?? null;
    const commitment = match.commitments[seat] ?? "";
    seats.push({
      civIndex: (seat % 4) as CivIndex,
      bot: player === null ? null : shortenAddress(player),
      wallet: player,
      isYou: player !== null && player === wallet,
      hasJoined: player !== null,
      hasCommitted: match.committed[seat] ?? false,
      hasRevealed: match.revealed[seat] ?? false,
      policyHash: commitment === "" ? null : `${commitment.slice(0, 4)}…${commitment.slice(-4)}`,
    });
  }
  return seats;
}

/**
 * What the lobby page offers next. Steps a player takes for themselves (connect, join, commit,
 * reveal) come first; steps anyone may take (start, play, settle, cancel) are offered to whoever is
 * looking, because the program lets anyone call them.
 */
export type LobbyStep =
  | "connect"
  | "join"
  | "commit"
  | "waitForPlayers"
  | "waitForCommits"
  | "reveal"
  | "waitForReveals"
  | "start"
  | "waitForSeed"
  | "retrySeed"
  | "play"
  | "settle"
  | "cancel"
  | "watch"
  | "closed";

/** The next step on the lobby page for `wallet` (null = no wallet connected). */
export function nextLobbyStep(match: MatchAccountView | null, wallet: string | null, nowSeconds: number): LobbyStep {
  if (match === null || match.status === "settled" || match.status === "cancelled") return "closed";
  if (match.status === "running") return match.turn < MATCH_TURNS ? "play" : "settle";
  if (match.status === "seedRequested") {
    return nowSeconds > match.seedRequestedAt + SEED_REQUEST_TIMEOUT_SECONDS ? "retrySeed" : "waitForSeed";
  }
  return openLobbyStep(match, wallet, nowSeconds);
}

/** The next step while the lobby is Open. */
function openLobbyStep(match: MatchAccountView, wallet: string | null, now: number): LobbyStep {
  const isFull = match.players.length >= match.maxPlayers;
  const seat = wallet === null ? -1 : match.players.indexOf(wallet);
  const hasJoined = seat >= 0;
  const hasCommitted = hasJoined && (match.committed[seat] ?? false);
  const hasRevealed = hasJoined && (match.revealed[seat] ?? false);

  // Before the lobby is full: join, commit, or (past the deadline) cancel and refund everyone.
  if (!isFull) {
    if (now > match.joinDeadline) return "cancel";
    if (wallet === null) return "connect";
    if (!hasJoined) return "join";
    if (!hasCommitted && now <= match.commitDeadline) return "commit";
    return "waitForPlayers";
  }

  // Full: commits, then reveals, then anyone may start.
  const everyoneCommitted = match.committed.every(Boolean);
  const everyoneRevealed = match.revealed.every(Boolean);
  if (everyoneRevealed || now > match.revealDeadline) return "start";
  if (!hasJoined) return wallet === null ? "connect" : "watch";
  if (!hasCommitted) return now <= match.commitDeadline ? "commit" : "waitForReveals";
  if (hasRevealed) return "waitForReveals";
  if (everyoneCommitted || now > match.commitDeadline) return "reveal";
  return "waitForCommits";
}

/** "mm:ss" until a deadline ("00:00" once it has passed). */
export function countdown(deadlineSeconds: number, nowSeconds: number): string {
  const left = Math.max(0, deadlineSeconds - nowSeconds);
  const minutes = Math.floor(left / 60);
  const seconds = left % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
