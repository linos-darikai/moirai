// Reading civ-core's compile problems. The WASM engine reports each one as the text
// `line<TAB>code<TAB>detail` (crates/civ-wasm, `policyProblems`); this turns them into typed
// objects for the editor. Pure: no React, no WASM.

import type { CompilerProblem, CompilerProblemCode } from "../types/policy";
import { COMPILER_PROBLEM_CODES } from "../types/policy";

/** True if `code` is one the app has a message for. */
function isCompilerProblemCode(code: string): code is CompilerProblemCode {
  return (COMPILER_PROBLEM_CODES as readonly string[]).includes(code);
}

/** Parses the engine's problem lines. Lines that can't be read (an engine newer than the app)
 * become `unknownRuleLine` on their line, so a problem is never silently dropped. */
export function parseCompilerProblems(lines: readonly string[]): CompilerProblem[] {
  const problems: CompilerProblem[] = [];
  for (const line of lines) {
    const [lineText = "0", code = "", detail = ""] = line.split("\t");
    const lineNumber = Number.parseInt(lineText, 10);
    problems.push({
      line: Number.isNaN(lineNumber) ? 0 : lineNumber,
      code: isCompilerProblemCode(code) ? code : "unknownRuleLine",
      detail,
    });
  }
  return problems;
}
