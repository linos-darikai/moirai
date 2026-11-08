// Sample live match, replay moments and results, shown until the match program exists (Phase 2).

import type { MatchDetail, MatchResults, ReplayMoment } from "../types/game";

/** Seed used for every sample match so the map is the same on every page (civ-core generates it). */
export const SAMPLE_SEED_HEX = "9f3ca71e5b20d4c8e17a0f6b39c2d58a1e4f7b0c6d93a25e8f1b4c07d6e9a31f";

export const SAMPLE_MATCH: MatchDetail = {
  id: "#9C21",
  metric: "territory",
  turn: 37,
  totalTurns: 60,
  poolSol: 2,
  seedHex: SAMPLE_SEED_HEX,
  lastCrankWallet: "Qe8T…71xC",
  lastCrankRewardSol: 0.0013,
  civs: [
    { civIndex: 0, bot: "iron-turtle", wallet: "7xKq…3fPa", isYou: true, tiles: 74, resources: { food: 62, ore: 41, gold: 18 }, units: { infantry: 4, guard: 9, siege: 2, elite: 1 }, army: 31 },
    { civIndex: 3, bot: "wide-expander", wallet: "Lp0Z…mm2D", isYou: false, tiles: 61, resources: { food: 38, ore: 22, gold: 30 }, units: { infantry: 6, guard: 3, siege: 1, elite: 0 }, army: 19 },
    { civIndex: 1, bot: "red-raider", wallet: "Gw4N…c81Q", isYou: false, tiles: 52, resources: { food: 21, ore: 57, gold: 9 }, units: { infantry: 11, guard: 2, siege: 4, elite: 1 }, army: 38 },
    { civIndex: 2, bot: "silk-trader", wallet: "B2mR…9tLe", isYou: false, tiles: 33, resources: { food: 44, ore: 15, gold: 71 }, units: { infantry: 2, guard: 5, siege: 0, elite: 0 }, army: 12 },
  ],
  feed: [
    { turn: 37, civIndex: 1, kind: "attack", defender: 3, x: 9, y: 6, tiles: 2 },
    { turn: 37, civIndex: 0, kind: "claimDeposit", resource: "gold", x: 6, y: 4 },
    { turn: 37, civIndex: 2, kind: "sell", resource: "gold", amount: 10, priceChange: -0.04 },
    { turn: 36, civIndex: 3, kind: "buildElite" },
    { turn: 36, civIndex: 0, kind: "buildGuards", count: 2, side: "east" },
    { turn: 35, civIndex: 1, kind: "lowFood", rule: 1, workers: 3 },
  ],
  market: [
    { resource: "food", price: 0.82, change: 0.03 },
    { resource: "ore", price: 1.35, change: 0.11 },
    { resource: "gold", price: 1, change: -0.04 },
  ],
};

export const SAMPLE_REPLAY_MOMENTS: readonly ReplayMoment[] = [
  { turn: 3, id: "firstGold", tone: "gold" },
  { turn: 12, id: "firstGuards", tone: 0 },
  { turn: 21, id: "firstBattle", tone: "ore" },
  { turn: 29, id: "goldMarket", tone: 2 },
  { turn: 37, id: "expander60", tone: 3 },
  { turn: 44, id: "turtleStrikes", tone: "ore" },
  { turn: 52, id: "traderStarves", tone: "food" },
  { turn: 60, id: "finalTurn", tone: "success" },
];

export const SAMPLE_RESULTS: MatchResults = {
  id: "#9B4E",
  metric: "territory",
  turns: 60,
  seedHex: SAMPLE_SEED_HEX,
  poolSol: 2,
  crankRewardsSol: 0.03,
  rentReturnedSol: 0.0094,
  transactions: { committed: "2fWq…9kLm", settled: "7Hn4…Qa2x", closed: "3Ckd…Vb8p" },
  rows: [
    { ...SAMPLE_MATCH.civs[0], place: 1, tiles: 74, payoutSol: 1.97, eloChange: 24, eloAfter: 1684, policyHash: "9f3c…e1a7" },
    { ...SAMPLE_MATCH.civs[1], place: 2, tiles: 61, payoutSol: 0, eloChange: 6, eloAfter: 1541, policyHash: "77e2…a90f" },
    { ...SAMPLE_MATCH.civs[2], place: 3, tiles: 52, payoutSol: 0, eloChange: -9, eloAfter: 1590, policyHash: "41aa…07c2" },
    { ...SAMPLE_MATCH.civs[3], place: 4, tiles: 33, payoutSol: 0, eloChange: -21, eloAfter: 1622, policyHash: "c0d9…5b31" },
  ],
};
