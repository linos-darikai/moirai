// Policy draft checks for the editor (docs/decisions/0008). civ-core's compiler, run in WASM, is
// the source of truth for errors (hooks/usePolicies.ts). This lightweight reader lists the rules
// for the rules view, finds the "rarely runs" warning the compiler doesn't give, and stands in for
// the compiler until the WASM engine has loaded. The program re-validates at reveal.

import type { PolicyCheck, PolicyProblem, PolicyRule } from "../types/policy";

/** Most rules a policy may have (PLAN.md section 3, "Limits"). */
export const MAX_RULES_PER_POLICY = 16;
/** Only this many matching rules act each turn. */
export const MAX_ACTIVE_RULES_PER_TURN = 3;
/** A rule joins at most this many conditions with `and` (civ-core MAX_CONDITIONS_PER_RULE). */
export const MAX_CONDITIONS_PER_RULE = 3;
/** The longest policy name (civ-core MAX_POLICY_NAME_LENGTH). */
export const MAX_POLICY_NAME_LENGTH = 32;

/** Values a condition may read (docs/decisions/0008, "Conditions"; civ-core `policy::Value`). */
export const KNOWN_CONDITIONS: readonly string[] = [
  "food", "ore", "gold", "coins",
  "food_price", "ore_price", "gold_price",
  "base_food_price", "base_ore_price", "base_gold_price",
  "my.army", "my.tiles", "my.cities",
  "my.infantry", "my.guards", "my.siege", "my.elites", "my.settlers", "my.workers",
  "weakest_neighbor.army", "strongest_neighbor.army",
  "nearest_enemy.army", "nearest_enemy.distance", "richest_enemy.army",
  "my.marching", "my.wealth",
  "turn", "always",
];

/** Actions a rule may take (docs/decisions/0008, "Actions"; civ-core `policy::PolicyAction`). */
export const KNOWN_ACTIONS: readonly string[] = [
  "build", "rush", "found_city", "claim_tile", "assign_workers", "sell", "buy", "attack",
];

/** Words that join conditions rather than name a value. */
const CONDITION_KEYWORDS: readonly string[] = ["and", "or", "not"];

const RULE_START = /^\s*-\s*if:\s*(.*)$/;
const RULE_ACTION = /^\s*do:\s*(.*)$/;
const RULES_HEADER = /^\s*rules:\s*$/;
const WORD = /[a-z_][a-z_.]*/g;

/** Reads the rules out of the YAML: every `- if:` line and the `do:` that follows it. */
function readRules(lines: readonly string[]): PolicyRule[] {
  const rules: PolicyRule[] = [];
  let isInsideRules = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";
    if (RULES_HEADER.test(line)) {
      isInsideRules = true;
      continue;
    }
    if (!isInsideRules) continue;

    const ruleStart = RULE_START.exec(line);
    if (ruleStart !== null) {
      rules.push({ number: rules.length + 1, line: index + 1, condition: (ruleStart[1] ?? "").trim(), action: null });
      continue;
    }
    const action = RULE_ACTION.exec(line);
    const currentRule = rules[rules.length - 1];
    if (action !== null && currentRule !== undefined && currentRule.action === null) {
      currentRule.action = (action[1] ?? "").trim();
    }
  }
  return rules;
}

/** Problems inside one rule: missing action, unknown condition words, unknown action name. */
function checkRule(rule: PolicyRule): PolicyProblem[] {
  const problems: PolicyProblem[] = [];

  for (const word of rule.condition.match(WORD) ?? []) {
    const isKnown = KNOWN_CONDITIONS.includes(word) || CONDITION_KEYWORDS.includes(word);
    if (!isKnown) problems.push({ kind: "unknownCondition", line: rule.line, word });
  }

  if (rule.action === null || rule.action === "") {
    problems.push({ kind: "missingDo", rule: rule.number, line: rule.line });
    return problems;
  }
  const actionName = rule.action.split("(")[0]?.trim() ?? "";
  if (!KNOWN_ACTIONS.includes(actionName)) {
    problems.push({ kind: "unknownAction", line: rule.line + 1, word: actionName });
  }
  return problems;
}

/**
 * Rules after an `always` rule rarely run: the always rule takes one of the 3 action slots every
 * turn, so a later rule only acts on turns where few earlier rules matched.
 */
function findShadowedRules(rules: readonly PolicyRule[]): PolicyProblem[] {
  const alwaysRule = rules.find((rule) => rule.condition === "always");
  if (alwaysRule === undefined || alwaysRule.number < MAX_ACTIVE_RULES_PER_TURN) return [];

  const warnings: PolicyProblem[] = [];
  for (const rule of rules) {
    if (rule.number > alwaysRule.number) {
      warnings.push({ kind: "shadowed", rule: rule.number, line: rule.line, alwaysRule: alwaysRule.number });
    }
  }
  return warnings;
}

/** Checks a policy draft and returns its rules, blocking errors and warnings. */
export function checkPolicy(yaml: string): PolicyCheck {
  const lines = yaml.split("\n");
  const rules = readRules(lines);

  const errors: PolicyProblem[] = [];
  if (rules.length === 0) errors.push({ kind: "noRules" });
  if (rules.length > MAX_RULES_PER_POLICY) {
    errors.push({ kind: "tooManyRules", count: rules.length, max: MAX_RULES_PER_POLICY });
  }
  for (const rule of rules) {
    errors.push(...checkRule(rule));
  }

  const warnings = findShadowedRules(rules);
  const warningLines = warnings.flatMap((warning) => ("line" in warning ? [warning.line] : []));
  return { rules, errors, warnings, warningLines };
}

/** SHA-256 of some bytes, as hex: the editor shows it for the compiled policy. (The commitment
 * sent on chain is sha256(compiled_policy_bytes || salt), PLAN.md section 3.) */
export async function hashBytes(bytes: Uint8Array): Promise<string> {
  // Copy into a fresh ArrayBuffer-backed array: Web Crypto only accepts those.
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
