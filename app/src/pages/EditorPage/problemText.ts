// Turns a policy problem (from civ-core's compiler or the quick TypeScript reader) into a sentence
// in the player's language. Used by the editor page only.

import type { TranslationFunctions } from "../../i18n";
import { MAX_CONDITIONS_PER_RULE, MAX_POLICY_NAME_LENGTH, MAX_RULES_PER_POLICY } from "../../model/policyCheck";
import type { CompilerProblem, PolicyProblem } from "../../types/policy";

/** A problem as a sentence. */
export function problemText(problem: PolicyProblem, LL: TranslationFunctions): string {
  const text = LL.policies.editor.problems;
  switch (problem.kind) {
    case "noRules":
      return text.noRules();
    case "missingDo":
      return text.missingDo({ rule: problem.rule, line: problem.line });
    case "unknownCondition":
      return text.unknownCondition({ line: problem.line, word: problem.word });
    case "unknownAction":
      return text.unknownAction({ line: problem.line, word: problem.word });
    case "tooManyRules":
      return text.tooManyRules({ count: problem.count, max: problem.max });
    case "shadowed":
      return text.shadowed({ line: problem.line, rule: problem.rule, alwaysRule: problem.alwaysRule });
    case "compiler":
      return compilerProblemText(problem.problem, LL);
  }
}

/** A compiler problem as a sentence, starting with "Line N:" when it is about one line. */
function compilerProblemText(problem: CompilerProblem, LL: TranslationFunctions): string {
  const message = compilerMessage(problem, LL);
  if (problem.line === 0) return message;
  return LL.policies.editor.problems.onLine({ line: problem.line, message });
}

/** The message for one compiler code, without the line. */
function compilerMessage(problem: CompilerProblem, LL: TranslationFunctions): string {
  const text = LL.policies.editor.problems;
  const compiler = text.compiler;
  const { detail } = problem;
  switch (problem.code) {
    case "missingName":
      return compiler.missingName();
    case "nameTooLong":
      return compiler.nameTooLong({ max: MAX_POLICY_NAME_LENGTH });
    case "noRules":
      return text.noRules();
    case "tooManyRules":
      return text.tooManyRules({ count: Number(detail), max: MAX_RULES_PER_POLICY });
    case "unknownKey":
      return compiler.unknownKey({ key: detail });
    case "lineOutsideRules":
      return compiler.lineOutsideRules();
    case "unknownRuleLine":
      return compiler.unknownRuleLine();
    case "doWithoutIf":
      return compiler.doWithoutIf();
    case "missingDo":
      return compiler.missingDo();
    case "tooManyConditions":
      return compiler.tooManyConditions({ max: MAX_CONDITIONS_PER_RULE });
    case "missingComparison":
      return compiler.missingComparison({ text: detail });
    case "unknownValue":
      return compiler.unknownValue({ word: detail });
    case "badNumber":
      return compiler.badNumber({ text: detail });
    case "unknownAction":
      return compiler.unknownAction({ word: detail });
    case "badArguments":
      return compiler.badArguments({ action: detail });
  }
}

/** True if a problem is an unknown word (condition, value or action). */
export function isUnknownWord(problem: PolicyProblem): boolean {
  if (problem.kind === "unknownCondition" || problem.kind === "unknownAction") return true;
  if (problem.kind !== "compiler") return false;
  return problem.problem.code === "unknownValue" || problem.problem.code === "unknownAction";
}
