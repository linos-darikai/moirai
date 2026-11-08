// Sample lobbies, live matches and the lobby detail, shown until the match program exists
// (Phase 2). Hooks in src/hooks read these; replace them with chain reads there, not here.

import type { LiveMatchSummary, LobbyDetail, LobbySummary } from "../types/game";

export const SAMPLE_LOBBIES: readonly LobbySummary[] = [
  { id: "#A41F", label: "#A41F", metric: "territory", entryFeeSol: 0.5, poolSol: 1.5, turns: 60, payout: "winnerTakesAll", joinedCount: 3, seatCount: 4, closesInMinutes: 14 },
  { id: "#B07C", label: "#B07C", metric: "wealth", entryFeeSol: 0.25, poolSol: 0.5, turns: 60, payout: "topThree", joinedCount: 2, seatCount: 4, closesInMinutes: 32 },
  { id: "#C3D2", label: "#C3D2", metric: "conquest", entryFeeSol: 1, poolSol: 1, turns: 80, payout: "winnerTakesAll", joinedCount: 1, seatCount: 4, closesInMinutes: 65 },
  { id: "#D918", label: "#D918", metric: "score", entryFeeSol: 0.1, poolSol: 0.3, turns: 40, payout: "topThree", joinedCount: 3, seatCount: 4, closesInMinutes: 6 },
  { id: "#E255", label: "#E255", metric: "territory", entryFeeSol: 0, poolSol: 0, turns: 60, payout: "practice", joinedCount: 2, seatCount: 4, closesInMinutes: 48 },
  { id: "#F6A0", label: "#F6A0", metric: "wealth", entryFeeSol: 0.5, poolSol: 0.5, turns: 60, payout: "winnerTakesAll", joinedCount: 1, seatCount: 4, closesInMinutes: 120 },
];

export const SAMPLE_LIVE_MATCHES: readonly LiveMatchSummary[] = [
  { id: "#9C21", leaderBot: "iron-turtle", metric: "territory", turn: 37, totalTurns: 60 },
  { id: "#9A07", leaderBot: "silk-trader", metric: "wealth", turn: 18, totalTurns: 60 },
  { id: "#98F3", leaderBot: "red-raider", metric: "conquest", turn: 54, totalTurns: 60 },
];

/** The lobby the player is joining. Its "your seat" is filled in by the Lobby page's steps. */
export const SAMPLE_LOBBY_DETAIL: LobbyDetail = {
  ...SAMPLE_LOBBIES[0],
  creatorWallet: "Gw4N…c81Q",
  joinDeadline: "14:02",
  revealDeadline: "08:47",
  seats: [
    { civIndex: 1, bot: "red-raider", wallet: "Gw4N…c81Q", isYou: false, hasJoined: true, hasCommitted: true, hasRevealed: false, policyHash: "41aa…07c2" },
    { civIndex: 2, bot: "silk-trader", wallet: "B2mR…9tLe", isYou: false, hasJoined: true, hasCommitted: true, hasRevealed: false, policyHash: "c0d9…5b31" },
    { civIndex: 3, bot: "wide-expander", wallet: "Lp0Z…mm2D", isYou: false, hasJoined: true, hasCommitted: true, hasRevealed: false, policyHash: "77e2…a90f" },
    { civIndex: 0, bot: null, wallet: null, isYou: true, hasJoined: false, hasCommitted: false, hasRevealed: false, policyHash: null },
  ],
  activity: [
    { time: "12:01", kind: "created", bot: null, wallet: "Gw4N…c81Q", transaction: "5Tq1…kP9a" },
    { time: "12:04", kind: "joinedCommitted", bot: "silk-trader", wallet: null, transaction: "3hRm…Uw2c" },
    { time: "12:09", kind: "joinedCommitted", bot: "wide-expander", wallet: null, transaction: "2Xbn…qE7d" },
  ],
};
