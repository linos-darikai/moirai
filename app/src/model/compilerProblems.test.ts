import { describe, expect, it } from "vitest";
import { parseCompilerProblems } from "./compilerProblems";

describe("parseCompilerProblems", () => {
  it("reads line, code and detail from each engine line", () => {
    const problems = parseCompilerProblems(["3\tunknownValue\tmana", "0\tmissingName\t"]);

    expect(problems).toEqual([
      { line: 3, code: "unknownValue", detail: "mana" },
      { line: 0, code: "missingName", detail: "" },
    ]);
  });

  it("keeps a problem with a code the app doesn't know yet", () => {
    const problems = parseCompilerProblems(["5\tsomethingNew\tx"]);

    expect(problems).toEqual([{ line: 5, code: "unknownRuleLine", detail: "x" }]);
  });
});
