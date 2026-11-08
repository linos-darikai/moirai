// English (base locale): text shared across the app. Page text lives in the namespace folders
// next to this file (lobbies/, policies/, matches/, players/). Every other locale must match
// these keys and parameters; `pnpm i18n` regenerates the types and checks it.
//
// Syntax: {name:string} = a typed parameter, {count:number|integer} = formatted with a formatter
// from ../formatters.ts, {{count:one|other}} = plural chosen by `count`.

import type { BaseTranslation } from "../i18n-types.js";

const en = {
  appName: "Moirai",
  nav: {
    main: "Main",
    homeLink: "Moirai, back to lobbies",
    lobbies: "Lobbies",
    policies: "Policies",
    simulator: "Simulator",
    matches: "Matches",
    leaderboard: "Leaderboard",
    rules: "Rules",
    ranks: "Ranks",
    back: "Back",
  },
  network: {
    devnet: "Devnet",
  },
  wallet: {
    connect: "Connect wallet",
    connected: "Your profile, wallet {address:string}, {balance:string}",
    balanceLoading: "…",
  },
  language: {
    label: "Language",
    draft: "draft translation",
  },
  preview: {
    banner:
      "Preview: lobbies, matches and players are sample data until the match program ships. The map, game engine and wallet are live.",
  },
  footer: {
    devnetOnly: "Devnet only. Entry fees and prizes use test SOL and have no real value.",
    program: "Program",
  },
  states: {
    loading: "Loading…",
    error: "Something went wrong: {message:string}",
  },
  routeError: {
    title: "This page couldn't load",
    body: "The link may be wrong, or something broke on our side.",
    home: "Back to lobbies",
  },
  breadcrumb: "Breadcrumb",
  sol: "{amount:number|sol}",
  tiles: "{count:number|integer} {{count:tile|tiles}}",
  turnOf: "Turn {turn:number} of {total:number}",
  you: "{name:string} (you)",
  metric: {
    territory: "Territory",
    wealth: "Wealth",
    conquest: "Conquest",
    score: "Score",
  },
  metricDescription: {
    territory: "Most tiles owned at the final turn.",
    wealth: "Highest resource value at final market prices.",
    conquest: "Last civ standing, then most territory.",
    score: "A fixed mix of territory, wealth and army.",
  },
  resource: {
    food: "Food",
    ore: "Ore",
    gold: "Gold",
  },
  resourceAmount: {
    food: "{count:number|integer} food",
    ore: "{count:number|integer} ore",
    gold: "{count:number|integer} gold",
  },
  unit: {
    infantry: "Infantry",
    guard: "Guard",
    siege: "Siege",
    elite: "Elite",
  },
  status: {
    revealed: "Revealed",
    committed: "Committed",
    notCommitted: "Not committed",
    hidden: "Hidden",
    forfeited: "Forfeited",
    joined: "Joined",
    empty: "Empty",
    public: "Public",
    draft: "Draft",
  },
  payout: {
    winnerTakesAll: "Winner takes all",
    topThree: "Top 3 · 60/30/10",
    practice: "Practice",
  },
  map: {
    label: "Map at turn {turn:number}: {summary:string}. Gold outlines mark contested tiles.",
    civTiles: "{name:string} {count:number} tiles",
    legend: "Map legend",
    legendFood: "Food deposit",
    legendOre: "Ore deposit",
    legendGold: "Gold deposit",
    legendCity: "City",
    legendCitySite: "City site",
    legendContested: "Contested tile",
    previewNote:
      "Deposits and cities come from civ-core. Territory growth is a preview until the turn engine ships.",
  },
  army: "army {count:number|integer}",
  copyAddress: "Copy wallet address",
  copied: "Copied",
} satisfies BaseTranslation;

export default en;
