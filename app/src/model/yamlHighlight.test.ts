import { describe, expect, it } from "vitest";
import { highlightYamlLine } from "./yamlHighlight";

describe("highlightYamlLine", () => {
  it("colours the key, keyword, operator and number of a rule", () => {
    const tokens = highlightYamlLine("  - if: ore >= 30 and my.guards < 4");

    expect(tokens.filter((token) => token.kind !== "plain").map((token) => [token.text, token.kind])).toEqual([
      ["- ", "punctuation"],
      ["if:", "key"],
      [">=", "operator"],
      ["30", "number"],
      ["and", "keyword"],
      ["<", "operator"],
      ["4", "number"],
    ]);
  });

  it("marks actions as calls and keeps the original text", () => {
    const line = "    do: claim_tile(nearest_deposit)";

    const tokens = highlightYamlLine(line);

    expect(tokens.map((token) => token.text).join("")).toBe(line);
    expect(tokens.at(-1)).toEqual({ text: "claim_tile(nearest_deposit)", kind: "call" });
  });
});
