// Starting policies for the editor: the player's sample drafts and the four templates
// (turtle, raider, trader, expander). Policy YAML keywords stay in English in every language:
// they are code the program reads, like a programming language.

import type { PolicyDraft, PolicyTemplate } from "../types/policy";


const IRON_TURTLE_V3 = `name: iron-turtle
version: 3
rules:
  - if: food < 40
    do: assign_workers(farm, 3)
  - if: turn < 10
    do: claim_tile(nearest_deposit)
  - if: ore >= 30 and my.guards < 4
    do: build(guard)
  - if: gold_price > 150% avg_gold_price
    do: sell(gold, 10)
  - if: my.army > 130% weakest_neighbor.army
    do: attack(weakest_neighbor)
  - if: always
    do: claim_tile(nearest_deposit)
  - if: food > 120
    do: build(infantry)
`;

export const TEMPLATE_YAML: Record<PolicyTemplate, string> = {
  turtle: `name: turtle
rules:
  - if: food < 50
    do: assign_workers(farm, 3)
  - if: ore >= 30
    do: build(guard)
  - if: always
    do: defend
`,
  raider: `name: raider
rules:
  - if: food < 30
    do: assign_workers(farm, 2)
  - if: my.army > 130% weakest_neighbor.army
    do: attack(weakest_neighbor)
  - if: always
    do: build(infantry)
`,
  trader: `name: trader
rules:
  - if: gold_price > 150% avg_gold_price
    do: sell(gold, 20)
  - if: ore_price < 80% avg_ore_price
    do: buy(ore, 10)
  - if: always
    do: claim_tile(nearest_deposit)
`,
  expander: `name: expander
rules:
  - if: food < 40
    do: assign_workers(farm, 3)
  - if: always
    do: claim_tile(nearest_deposit)
`,
};

export const SAMPLE_DRAFTS: readonly PolicyDraft[] = [
  { id: "iron-turtle-v3", name: "iron-turtle v3", yaml: IRON_TURTLE_V3, matches: 0, wins: 0 },
  { id: "iron-turtle-v2", name: "iron-turtle v2", yaml: IRON_TURTLE_V3.replace("version: 3", "version: 2"), matches: 12, wins: 7 },
  { id: "night-shepherd", name: "night-shepherd", yaml: TEMPLATE_YAML.turtle.replace("name: turtle", "name: night-shepherd"), matches: 3, wins: 1 },
];

/** Simulator opponents: the sample bots and their play style. */
export const SAMPLE_OPPONENTS = [
  { id: "red-raider", civIndex: 1, style: "aggressive" },
  { id: "silk-trader", civIndex: 2, style: "economic" },
  { id: "wide-expander", civIndex: 3, style: "expansion" },
] as const;
