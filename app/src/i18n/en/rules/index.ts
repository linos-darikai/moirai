// English: the in-game Rules page. Numbers are parameters so the text always matches
// src/data/rules.ts (and civ-core).

import type { BaseTranslation } from "../../i18n-types.js";

const en_rules = {
  title: "How to play",
  intro:
    "Moirai is a bot arena. You don't move pieces: you write a policy, and the Solana program plays it for you, every turn, by the same rules for everyone. These are those rules.",
  contents: "On this page",
  goal: {
    title: "The goal",
    body: "{min:number} to {max:number} civilisations share a {size:number} × {size:number} map for {turns:number} turns. The lobby picks how the winner is decided: most land, most wealth, last civ standing, or a mixed score.",
  },
  map: {
    title: "The map",
    mirrored:
      "The map comes from a random seed drawn after every policy is revealed. One quarter is generated and mirrored into the other three, so every civ starts with exactly the same surroundings.",
    deposits: "About {percent:number}% of tiles hold a deposit of Food, Ore or Gold.",
    sites:
      "City sites are tiles where a city can be built. Each quarter has {count:number} besides the capital's, at least {distance:number} tiles apart. Every capital starts on one.",
  },
  cities: {
    title: "Cities and borders",
    capital: "You start with one city, your capital, at size 1. You can hold up to {max:number} cities.",
    start:
      "Every civ starts with the same stock: {food:number} Food, {ore:number} Ore, {gold:number} Gold, {coins:number} coins and {workers:number} Workers.",
    radius:
      "A city owns every free tile within its reach: size + 1 tiles away (counted in straight steps, no diagonals). Growing never takes land another civ already owns.",
    growth:
      "Each turn a city gains growth points: 1, plus 1 for every deposit you own within its reach. When it has 20 × size² points it grows to the next size (up to {max:number}) and claims the next ring of land.",
    lock:
      "When a city has nowhere left to grow because the next ring is all taken, it stops growing for good. That line is your border. After that, land only changes hands by war, or by buying a tile with claim_tile.",
    settlers: "Settlers found new cities: found_city uses one settler to build a size-1 city on a free city site next to your land.",
    growthTable: "Growth by size",
    size: "Size",
    reach: "Reach",
    pointsToGrow: "Points to grow",
    maxSize: "maximum",
  },
  economy: {
    title: "Economy",
    deposits:
      "A deposit you own produces {amount:number} of its resource per turn, but only while a Worker works it. Each Worker works one deposit. Workers go to your assign_workers resource first, then spread evenly.",
    coins:
      "Coins pay for units and market purchases. Every city pays {coins:number} coin per size each turn, and selling on the market earns more.",
    cityIncome:
      "Every city produces {food:number} Food, {ore:number} Ore and {gold:number} Gold per size, per turn.",
    upkeep:
      "Units eat Food every turn. If you can't feed them, your most expensive units are disbanded until your Food is back above zero.",
    claim: "claim_tile buys one free tile next to your land for {food:number} Food and {gold:number} Gold.",
    market:
      "One market is shared by everyone: sell resources for coins, buy them with coins. A resource's price rises as it gets scarce and falls when it's plentiful, between {min:number}% and {max:number}% of its base price. A trade is priced at the supply after it and loses {spread:number}% to the spread, so buying and selling back and forth never makes money.",
    basePrices: "Base prices, in coins: Food {food:string}, Ore {ore:string}, Gold {gold:string}.",
  },
  units: {
    title: "Units",
    intro:
      "Units are counted per civilisation (they don't stand on tiles in this version). Each is strong against one other, like rock-paper-scissors: a strong matchup counts ×{bonus:string}.",
    settler: "Settler",
    worker: "Worker",
    unit: "Unit",
    attack: "Attack",
    defence: "Defence",
    cost: "Cost",
    coins: "Coins",
    buildTurns: "Build turns",
    upkeep: "Food per turn",
    strongAgainst: "Strong against",
    walls: "city walls",
    all: "everything (×{bonus:string})",
    none: "—",
    eliteCap: "You can field one Elite per city size you own, counting Elites being built.",
    building:
      "Each city builds one unit at a time. You pay when the build starts, and the unit joins your army when its build turns are done. rush finishes a build right away for {multiplier:number} × its coins for every turn left: the faster, the more expensive.",
  },
  warfare: {
    title: "Warfare",
    attack: "attack sends your whole army (everything except Settlers and Workers) at one enemy tile or city next to your land.",
    defenders: "The defender's army is spread evenly over its cities and borders, so each target is held by its share of every unit kind.",
    strength:
      "Attack is your units' attack, with matchup bonuses. Defence is the defenders' defence plus city walls: {walls:number} per city size, +{capital:number}% for a capital. Siege counts ×{siege:string} against walls. Each side rolls up to ±{roll:number}%.",
    win: "If attack beats defence, every defender there is destroyed and the target falls. A tile changes owner. A city is captured (it drops one size), or razed if you chose attack(target, raze): it's destroyed and its land becomes free.",
    plunder: "Taking or razing a city also takes a share of the loser's stockpile: their stock divided by their number of cities.",
    lose: "If attack doesn't beat defence, both sides lose units in proportion to the other side's strength.",
    capital: "If a capital falls, that civ's largest remaining city becomes its new capital.",
    elimination: "A civilisation with no cities left is out of the game.",
  },
  turn: {
    title: "A turn, step by step",
    steps: {
      count: "Count what everyone owns.",
      produce: "Worked deposits and cities produce resources and coins.",
      grow: "Cities grow, their borders move, and finished units join their armies.",
      decide: "Every policy decides from the same snapshot of the world. Only the first {count:number} matching rules act.",
      resolve: "All actions happen together: builds and rushes, found cities, claim tiles, assign workers, trade, then attacks. Who goes first rotates every turn.",
      upkeep: "Units eat. Unfed units are disbanded.",
      eliminate: "Civs with no cities are removed.",
    },
  },
  winning: {
    title: "Winning",
    metric: "Win metric",
    winner: "Winner",
    territory: "Most tiles after the last turn.",
    wealth: "Most coins plus the value of all resources at the final market prices.",
    conquest: "Last civ standing; if several remain, most tiles.",
    score: "Tiles × {tiles:number} + wealth ÷ {wealth:number} + army strength.",
  },
  policy: {
    title: "Your policy",
    body: "A policy is an ordered list of up to {max:number} if/then rules. Each turn, the first {active:number} rules whose condition is true act. You can test it free in the simulator before you stake anything.",
    edit: "Open the policy editor",
  },
} satisfies BaseTranslation;

export default en_rules;
