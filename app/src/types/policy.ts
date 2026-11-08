// Policy shapes for the editor: saved drafts, templates, and what checking a draft finds.

/** A saved policy draft in the editor. */
export type PolicyDraft = {
  id: string;
  name: string;
  yaml: string;
  /** Matches played with it (0 for a draft never used). */
  matches: number;
  wins: number;
};

/** The four starting templates (PLAN.md section 9: turtle, raider, trader, expander). */
export type PolicyTemplate = "turtle" | "raider" | "trader" | "expander";
export const POLICY_TEMPLATES: readonly PolicyTemplate[] = ["turtle", "raider", "trader", "expander"];

/** One if/then rule read from the YAML. */
export type PolicyRule = {
  /** 1-based rule number, as players count them. */
  number: number;
  /** 1-based line of the rule's `if:`. */
  line: number;
  condition: string;
  action: string | null;
};

/** The problems civ-core's compiler can report (civ-core `CompileProblem::code`). */
export const COMPILER_PROBLEM_CODES = [
  "missingName",
  "nameTooLong",
  "noRules",
  "tooManyRules",
  "unknownKey",
  "lineOutsideRules",
  "unknownRuleLine",
  "doWithoutIf",
  "missingDo",
  "tooManyConditions",
  "missingComparison",
  "unknownValue",
  "badNumber",
  "unknownAction",
  "badArguments",
] as const;
export type CompilerProblemCode = (typeof COMPILER_PROBLEM_CODES)[number];

/** One problem from the compiler: its line (0 = the whole policy), code, and the word involved. */
export type CompilerProblem = { line: number; code: CompilerProblemCode; detail: string };

/** What compiling a draft gives: the bytes a player commits to, or every problem. */
export type CompiledPolicy = { isValid: true; bytes: Uint8Array } | { isValid: false; problems: CompilerProblem[] };

/** A problem found in a draft. `kind` picks the `policies.editor.problems.<kind>` text. */
export type PolicyProblem =
  | { kind: "noRules" }
  | { kind: "missingDo"; rule: number; line: number }
  | { kind: "unknownCondition"; line: number; word: string }
  | { kind: "unknownAction"; line: number; word: string }
  | { kind: "tooManyRules"; count: number; max: number }
  | { kind: "shadowed"; rule: number; line: number; alwaysRule: number }
  /** From civ-core's compiler (the source of truth once the WASM engine has loaded). */
  | { kind: "compiler"; problem: CompilerProblem };

/** Everything the editor shows about a draft. */
export type PolicyCheck = {
  rules: PolicyRule[];
  /** Blocking problems: the policy can't be used until they're fixed. */
  errors: PolicyProblem[];
  /** Advice: the policy works but probably not as intended. */
  warnings: PolicyProblem[];
  /** Lines (1-based) that have a warning, to highlight in the code view. */
  warningLines: number[];
};
