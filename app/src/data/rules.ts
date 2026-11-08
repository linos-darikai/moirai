// The game's rule numbers, shown on the Rules page. Sources: docs/decisions/0006 (cities, war),
// 0007 (coins, Workers, build time), 0008 (starting stock) and 0010 (marching armies). These must match
// crates/civ-core/src/rules.rs. Percentages are whole percents here for display; civ-core stores
// bps. Prices are in coins.

import type { ResourceAmounts, UnitKind } from "../types/game";

/** Units on the Rules page: the four fighting units plus the two that don't fight. */
export type RulesUnitKind = UnitKind | "settler" | "worker";
export const RULES_UNIT_KINDS: readonly RulesUnitKind[] = ["infantry", "guard", "siege", "elite", "settler", "worker"];

export type UnitRule = {
  attack: number;
  defence: number;
  cost: ResourceAmounts;
  /** Coins on top of `cost`. */
  coins: number;
  /** Turns a city spends building one. */
  buildTurns: number;
  /** Food eaten per turn. */
  upkeep: number;
  /** Tiles per turn on an expedition (docs/decisions/0010). */
  speed: number;
  /** Which units it gets the matchup bonus against ("all" for the elite, "walls" for siege). */
  strongAgainst: readonly (UnitKind | "walls" | "all")[];
};

export const GAME_RULES = {
  mapSize: 16,
  minCivs: 2,
  maxCivs: 4,
  totalTurns: 120,
  depositChancePercent: 30,
  /** What every civ starts with. */
  startingStock: { food: 30, ore: 10, gold: 10 } satisfies ResourceAmounts,
  startingCoins: 20,
  startingWorkers: 2,
  /** A deposit produces this much per turn while a Worker works it (0 when unworked). */
  workedDepositYield: 2,
  citySitesPerQuarter: 3,
  minSiteDistance: 3,
  maxCities: 8,
  maxCitySize: 5,
  /** Growth points needed to grow from size s: growthBase × s². */
  growthBase: 20,
  cityIncomePerSize: { food: 2, ore: 1, gold: 1 } satisfies ResourceAmounts,
  coinIncomePerSize: 1,
  /** Rushing a build costs this × the unit's coins × turns left. */
  rushMultiplier: 2,
  claimTileCost: { food: 10, ore: 0, gold: 10 } satisfies ResourceAmounts,
  market: {
    targetSupply: 200,
    minPricePercent: 25,
    maxPricePercent: 400,
    spreadPercent: 5,
    basePrice: { food: 1, ore: 1.25, gold: 1.5 } satisfies ResourceAmounts,
  },
  battle: {
    strongBonusPercent: 150,
    eliteBonusPercent: 125,
    siegeWallBonusPercent: 150,
    wallsPerSize: 10,
    capitalWallBonusPercent: 50,
    rollPercent: 10,
  },
  policy: { maxRules: 16, maxActiveRules: 3 },
  score: { tileWeight: 3, wealthDivisor: 10 },
  units: {
    infantry: { attack: 3, defence: 2, cost: { food: 10, ore: 0, gold: 0 }, coins: 5, buildTurns: 1, upkeep: 1, speed: 2, strongAgainst: ["siege"] },
    guard: { attack: 2, defence: 5, cost: { food: 0, ore: 15, gold: 0 }, coins: 10, buildTurns: 2, upkeep: 1, speed: 1, strongAgainst: ["infantry"] },
    siege: { attack: 6, defence: 1, cost: { food: 0, ore: 10, gold: 10 }, coins: 15, buildTurns: 3, upkeep: 1, speed: 1, strongAgainst: ["guard", "walls"] },
    elite: { attack: 8, defence: 8, cost: { food: 0, ore: 0, gold: 40 }, coins: 40, buildTurns: 4, upkeep: 2, speed: 2, strongAgainst: ["all"] },
    settler: { attack: 0, defence: 1, cost: { food: 30, ore: 10, gold: 0 }, coins: 20, buildTurns: 3, upkeep: 1, speed: 1, strongAgainst: [] },
    worker: { attack: 0, defence: 1, cost: { food: 15, ore: 0, gold: 0 }, coins: 5, buildTurns: 2, upkeep: 1, speed: 1, strongAgainst: [] },
  } satisfies Record<RulesUnitKind, UnitRule>,
} as const;

/** Growth points a city of `size` needs to reach the next size. */
export function growthThreshold(size: number): number {
  return GAME_RULES.growthBase * size * size;
}

/** How far a city of `size` reaches (Manhattan distance). */
export function borderRadius(size: number): number {
  return size + 1;
}
