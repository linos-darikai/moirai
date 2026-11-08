// Sample leaderboard and profile, shown until the program records real results (Phase 2).

import type { PlayerProfile, PlayerRanking } from "../types/game";

export const SAMPLE_RANKINGS: readonly PlayerRanking[] = [
  { rank: 1, bot: "iron-turtle", wallet: "7xKq…3fPa", elo: 1684, matches: 41, winRate: 0.58, winningsSol: 14.2, bestPolicyHash: "9f3c…e1a7", colorIndex: 0 },
  { rank: 2, bot: "silk-trader", wallet: "B2mR…9tLe", elo: 1622, matches: 37, winRate: 0.51, winningsSol: 11.8, bestPolicyHash: "c0d9…5b31", colorIndex: 4 },
  { rank: 3, bot: "red-raider", wallet: "Gw4N…c81Q", elo: 1590, matches: 52, winRate: 0.44, winningsSol: 12.5, bestPolicyHash: "41aa…07c2", colorIndex: 1 },
  { rank: 4, bot: "wide-expander", wallet: "Lp0Z…mm2D", elo: 1541, matches: 29, winRate: 0.41, winningsSol: 6.1, bestPolicyHash: "77e2…a90f", colorIndex: 2 },
  { rank: 5, bot: "night-shepherd", wallet: "Qe8T…71xC", elo: 1515, matches: 18, winRate: 0.39, winningsSol: 3.4, bestPolicyHash: "1b0e…44dc", colorIndex: 3 },
  { rank: 6, bot: "salt-and-iron", wallet: "Hm2a…p0Rk", elo: 1498, matches: 22, winRate: 0.36, winningsSol: 2.9, bestPolicyHash: "a3f1…9c20", colorIndex: 5 },
  { rank: 7, bot: "quiet-harvest", wallet: "Vt7c…E3sn", elo: 1472, matches: 15, winRate: 0.33, winningsSol: 1.6, bestPolicyHash: "0d4b…7e61", colorIndex: 6 },
  { rank: 8, bot: "eight-gates", wallet: "Nn1q…Zx7b", elo: 1455, matches: 33, winRate: 0.3, winningsSol: 2.2, bestPolicyHash: "e9a7…12f8", colorIndex: 7 },
  { rank: 9, bot: "moth-and-flame", wallet: "Rd5W…k9Ue", elo: 1430, matches: 11, winRate: 0.27, winningsSol: 0.8, bestPolicyHash: "5c2e…b3a0", colorIndex: 8 },
  { rank: 10, bot: "long-winter", wallet: "Yb3s…Q2hT", elo: 1402, matches: 26, winRate: 0.23, winningsSol: 1.1, bestPolicyHash: "88f0…d7c4", colorIndex: 9 },
];

export const SAMPLE_PROFILE: PlayerProfile = {
  wallet: "7xKq…3fPa",
  bot: "iron-turtle",
  colorIndex: 0,
  rank: 1,
  playingSince: "2026-10-01",
  elo: 1684,
  lastEloChange: 24,
  matches: 41,
  wins: 24,
  winRate: 0.58,
  bestMetric: "territory",
  bestMetricWinRate: 0.71,
  winningsSol: 14.2,
  eloHistory: [1452, 1468, 1459, 1477, 1490, 1484, 1503, 1521, 1515, 1538, 1552, 1547, 1569, 1583, 1601, 1596, 1622, 1640, 1660, 1684],
  policies: [
    { name: "iron-turtle v2", hash: "9f3c…e1a7", matches: 12, wins: 7, isDraft: false },
    { name: "iron-turtle v1", hash: "2b71…08de", matches: 29, wins: 17, isDraft: false },
    { name: "iron-turtle v3", hash: null, matches: 0, wins: 0, isDraft: true },
  ],
  history: [
    { matchId: "#9B4E", metric: "territory", place: 1, playerCount: 4, eloChange: 24, payoutSol: 1.97, policyVersion: "v2" },
    { matchId: "#9A31", metric: "score", place: 1, playerCount: 4, eloChange: 20, payoutSol: 0.59, policyVersion: "v2" },
    { matchId: "#98C0", metric: "wealth", place: 2, playerCount: 4, eloChange: 5, payoutSol: 0.15, policyVersion: "v2" },
    { matchId: "#9772", metric: "conquest", place: 4, playerCount: 4, eloChange: -17, payoutSol: 0, policyVersion: "v1" },
    { matchId: "#9611", metric: "territory", place: 1, playerCount: 4, eloChange: 19, payoutSol: 0.98, policyVersion: "v2" },
    { matchId: "#94F8", metric: "territory", place: 3, playerCount: 4, eloChange: -6, payoutSol: 0, policyVersion: "v1" },
  ],
};
