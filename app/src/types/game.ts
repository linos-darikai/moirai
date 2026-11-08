// Game data shapes the app shows. Hooks return these; components render them. They mirror what the
// program and civ-core will provide (PLAN.md sections 2 and 4), so swapping sample data for chain
// reads only changes the hooks.

/** How a match is won (PLAN.md section 2, "Win metrics"). */
export type WinMetric = "territory" | "wealth" | "conquest" | "score";

/** Every win metric, in display order. */
export const WIN_METRICS: readonly WinMetric[] = ["territory", "wealth", "conquest", "score"];

export type ResourceKind = "food" | "ore" | "gold";
export const RESOURCE_KINDS: readonly ResourceKind[] = ["food", "ore", "gold"];

export type UnitKind = "infantry" | "guard" | "siege" | "elite";
export const UNIT_KINDS: readonly UnitKind[] = ["infantry", "guard", "siege", "elite"];

/** How the prize pool is paid out. */
export type PayoutKind = "winnerTakesAll" | "topThree" | "practice";

/** A civ's seat in join order, 0 to 3. Also picks its colour token. */
export type CivIndex = 0 | 1 | 2 | 3;

/** An amount of each resource. */
export type ResourceAmounts = Record<ResourceKind, number>;

/** How many units of each kind. */
export type UnitCounts = Record<UnitKind, number>;

/** One open lobby, as listed on the home page. */
export type LobbySummary = {
  id: string;
  metric: WinMetric;
  /** Entry fee in SOL (0 = free practice lobby). */
  entryFeeSol: number;
  /** SOL in the vault right now. */
  poolSol: number;
  turns: number;
  payout: PayoutKind;
  joinedCount: number;
  seatCount: number;
  /** Minutes until the join deadline. */
  closesInMinutes: number;
};

/** A match currently being played, for the "Live now" list. */
export type LiveMatchSummary = {
  id: string;
  leaderBot: string;
  metric: WinMetric;
  turn: number;
  totalTurns: number;
};

/** One row of the leaderboard. */
export type PlayerRanking = {
  rank: number;
  bot: string;
  wallet: string;
  elo: number;
  matches: number;
  /** Win rate as a fraction (0.58 = 58%). */
  winRate: number;
  winningsSol: number;
  bestPolicyHash: string;
  /** Index into the avatar colour list. */
  colorIndex: number;
};

/** A player's progress through join → commit → reveal in one lobby. */
export type EntryStep = "join" | "commit" | "reveal" | "play";
export const ENTRY_STEPS: readonly EntryStep[] = ["join", "commit", "reveal", "play"];

/** One seat in a lobby. `null` bot = the seat is still open. */
export type LobbySeat = {
  civIndex: CivIndex;
  bot: string | null;
  wallet: string | null;
  isYou: boolean;
  hasJoined: boolean;
  hasCommitted: boolean;
  hasRevealed: boolean;
  policyHash: string | null;
};

/** One line of a lobby's on-chain activity log. */
export type LobbyActivity = {
  /** Local time, e.g. "12:04". */
  time: string;
  kind: "created" | "joinedCommitted" | "youJoined" | "youCommitted" | "allRevealed";
  bot: string | null;
  wallet: string | null;
  transaction: string;
};

/** Everything the Lobby page shows. */
export type LobbyDetail = LobbySummary & {
  creatorWallet: string;
  seats: LobbySeat[];
  activity: LobbyActivity[];
  /** Countdown text shown as-is, e.g. "14:02". */
  joinDeadline: string;
  revealDeadline: string;
};

/** A civ's state in a live or finished match. */
export type CivStanding = {
  civIndex: CivIndex;
  bot: string;
  wallet: string;
  isYou: boolean;
  tiles: number;
  resources: ResourceAmounts;
  units: UnitCounts;
  army: number;
};

/** Something that happened in a turn. Text comes from `matches.feed.<kind>` translations. */
export type FeedEvent =
  | { turn: number; civIndex: CivIndex; kind: "attack"; defender: CivIndex; x: number; y: number; tiles: number }
  | { turn: number; civIndex: CivIndex; kind: "claimDeposit"; resource: ResourceKind; x: number; y: number }
  | { turn: number; civIndex: CivIndex; kind: "sell"; resource: ResourceKind; amount: number; priceChange: number }
  | { turn: number; civIndex: CivIndex; kind: "buildElite" }
  | { turn: number; civIndex: CivIndex; kind: "buildGuards"; count: number; side: "north" | "east" | "south" | "west" }
  | { turn: number; civIndex: CivIndex; kind: "lowFood"; rule: number; workers: number };

/** One resource's market price (in gold-equivalents) and its change this turn (a fraction). */
export type MarketPrice = {
  resource: ResourceKind;
  price: number;
  change: number;
};

/** Everything the Live match page shows. */
export type MatchDetail = {
  id: string;
  metric: WinMetric;
  turn: number;
  totalTurns: number;
  poolSol: number;
  /** 32-byte map seed as hex. */
  seedHex: string;
  lastCrankWallet: string;
  lastCrankRewardSol: number;
  civs: CivStanding[];
  feed: FeedEvent[];
  market: MarketPrice[];
};

/** A labelled point on the replay timeline. `id` picks `matches.replay.moments.<id>`. */
export type ReplayMoment = {
  turn: number;
  id:
    | "firstGold"
    | "firstGuards"
    | "firstBattle"
    | "goldMarket"
    | "expander60"
    | "turtleStrikes"
    | "traderStarves"
    | "finalTurn";
  /** Which colour marks it: a resource, a civ, or the "success" colour for the end. */
  tone: ResourceKind | CivIndex | "success";
};

/** One row of a finished match's final standings. */
export type ResultRow = CivStanding & {
  place: number;
  payoutSol: number;
  eloChange: number;
  eloAfter: number;
  policyHash: string;
};

/** Everything the Results page shows. */
export type MatchResults = {
  id: string;
  metric: WinMetric;
  turns: number;
  seedHex: string;
  rows: ResultRow[];
  poolSol: number;
  crankRewardsSol: number;
  rentReturnedSol: number;
  transactions: { committed: string; settled: string; closed: string };
};

/** A row of a player's match history. */
export type MatchHistoryEntry = {
  matchId: string;
  metric: WinMetric;
  place: number;
  playerCount: number;
  eloChange: number;
  payoutSol: number;
  policyVersion: string;
};

/** A policy a player has used or is drafting. */
export type PolicyRecord = {
  name: string;
  hash: string | null;
  matches: number;
  wins: number;
  isDraft: boolean;
};

/** Everything the Profile page shows. */
export type PlayerProfile = {
  wallet: string;
  bot: string;
  colorIndex: number;
  rank: number;
  /** First month played, as an ISO date ("2026-10-01"); shown in the viewer's locale. */
  playingSince: string;
  elo: number;
  lastEloChange: number;
  matches: number;
  wins: number;
  winRate: number;
  bestMetric: WinMetric;
  bestMetricWinRate: number;
  winningsSol: number;
  eloHistory: number[];
  policies: PolicyRecord[];
  history: MatchHistoryEntry[];
};
