// Starting policies for the editor: the player's sample drafts and the four templates
// (turtle, raider, trader, expander). Policy YAML keywords stay in English in every language:
// they are code the program reads, like a programming language.

// `?raw` makes Vite import a file's text as a string, so the templates are the exact bots civ-cli
// and the determinism tests play (docs/decisions/0008 describes the language).
import expanderYaml from "../../../policies/expander.yaml?raw";
import raiderYaml from "../../../policies/raider.yaml?raw";
import traderYaml from "../../../policies/trader.yaml?raw";
import turtleYaml from "../../../policies/turtle.yaml?raw";
import type { PolicyDraft, PolicyTemplate } from "../types/policy";

const IRON_TURTLE_V3 = `name: iron-turtle
version: 3
rules:
  - if: food < 25
    do: assign_workers(food)
  - if: my.workers < 5
    do: build(worker)
  - if: ore >= 15 and my.guards < 6
    do: build(guard)
  - if: gold_price > 150% base_gold_price
    do: sell(gold, 10)
  - if: my.army > 130% weakest_neighbor.army
    do: attack(weakest_neighbor)
  - if: always
    do: claim_tile(nearest_deposit)
  - if: food > 120
    do: build(infantry)
`;

/** The editor's templates: the four sample bots, read straight from the repo's policies/ folder. */
export const TEMPLATE_YAML: Record<PolicyTemplate, string> = {
  turtle: turtleYaml,
  raider: raiderYaml,
  trader: traderYaml,
  expander: expanderYaml,
};

export const SAMPLE_DRAFTS: readonly PolicyDraft[] = [
  { id: "iron-turtle-v3", name: "iron-turtle v3", yaml: IRON_TURTLE_V3, matches: 0, wins: 0 },
  { id: "iron-turtle-v2", name: "iron-turtle v2", yaml: IRON_TURTLE_V3.replace("version: 3", "version: 2"), matches: 12, wins: 7 },
  { id: "night-shepherd", name: "night-shepherd", yaml: TEMPLATE_YAML.turtle.replace("name: turtle", "name: night-shepherd"), matches: 3, wins: 1 },
];

/** Simulator opponents: the sample bots, their play style and which template they play. */
export const SAMPLE_OPPONENTS = [
  { id: "red-raider", civIndex: 1, style: "aggressive", template: "raider" },
  { id: "silk-trader", civIndex: 2, style: "economic", template: "trader" },
  { id: "wide-expander", civIndex: 3, style: "expansion", template: "expander" },
] as const;
