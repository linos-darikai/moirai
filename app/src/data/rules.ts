// The game's rule numbers, shown on the Rules page. Source: docs/decisions/0006-game-rules-v2.md.
// These must match crates/civ-core/src/rules.rs (a test will compare them once civ-core exposes
// its rules through WASM). Percentages are whole percents here for display; civ-core stores bps.

import type { ResourceAmounts, UnitKind } from "../types/game";

/** Units on the Rules page: the four fighting units plus the settler. */
export type RulesUnitKind = UnitKind | "settler";
export const RULES_UNIT_KINDS: readonly RulesUnitKind[] = ["infantry", "guard", "siege", "elite", "settler"];

export type UnitRule = {
  attack: number;
  defence: number;
  cost: ResourceAmounts;
  /** Food eaten per turn. */
  upkeep: number;
  /** Which units it gets the matchup bonus against ("all" for the elite, "walls" for siege). */
  strongAgainst: readonly (UnitKind | "walls" | "all")[];
};

export const GAME_RULES = {
  mapSize: 16,
  minCivs: 2,
  maxCivs: 4,
  totalTurns: 60,
  depositChancePercent: 30,
  depositYield: 1,
  citySitesPerQuarter: 3,
  minSiteDistance: 3,
  maxCities: 8,
  maxCitySize: 5,
  /** Growth points needed to grow from size s: growthBase × s². */
  growthBase: 20,
  cityIncomePerSize: { food: 2, ore: 1, gold: 1 } satisfies ResourceAmounts,
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
    infantry: { attack: 3, defence: 2, cost: { food: 10, ore: 0, gold: 0 }, upkeep: 1, strongAgainst: ["siege"] },
    guard: { attack: 2, defence: 5, cost: { food: 0, ore: 15, gold: 0 }, upkeep: 1, strongAgainst: ["infantry"] },
    siege: { attack: 6, defence: 1, cost: { food: 0, ore: 10, gold: 10 }, upkeep: 1, strongAgainst: ["guard", "walls"] },
    elite: { attack: 8, defence: 8, cost: { food: 0, ore: 0, gold: 40 }, upkeep: 2, strongAgainst: ["all"] },
    settler: { attack: 0, defence: 1, cost: { food: 30, ore: 10, gold: 0 }, upkeep: 1, strongAgainst: [] },
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
