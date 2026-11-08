import { describe, expect, it } from "vitest";
import { TEMPLATE_YAML } from "../data/policies";
import { SAMPLE_DRAFTS } from "../data/policies";
import { checkPolicy, hashBytes } from "./policyCheck";

describe("checkPolicy", () => {
  it("reads every rule and its action from a template", () => {
    const check = checkPolicy(TEMPLATE_YAML.raider);

    expect(check.rules).toHaveLength(5);
    expect(check.rules[1]?.action).toBe("attack(weakest_neighbor)");
    expect(check.errors).toEqual([]);
  });

  it("warns about rules after an always rule, like the design's rule 7", () => {
    const yaml = SAMPLE_DRAFTS[0]?.yaml ?? "";

    const check = checkPolicy(yaml);

    expect(check.warnings).toEqual([{ kind: "shadowed", rule: 7, line: 16, alwaysRule: 6 }]);
    expect(check.warningLines).toEqual([16]);
  });

  it("reports unknown conditions and actions with their line", () => {
    const check = checkPolicy("rules:\n  - if: mana > 3\n    do: cast(fireball)\n");

    expect(check.errors).toContainEqual({ kind: "unknownCondition", line: 2, word: "mana" });
    expect(check.errors).toContainEqual({ kind: "unknownAction", line: 3, word: "cast" });
  });

  it("accepts every sample bot", () => {
    for (const yaml of Object.values(TEMPLATE_YAML)) {
      expect(checkPolicy(yaml).errors).toEqual([]);
    }
  });

  it("asks for at least one rule", () => {
    const check = checkPolicy("name: empty\n");

    expect(check.errors).toEqual([{ kind: "noRules" }]);
  });
});

describe("hashBytes", () => {
  it("gives a 64-character hex hash that changes with the bytes", async () => {
    const first = await hashBytes(new Uint8Array([1]));
    const second = await hashBytes(new Uint8Array([2]));

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(second);
  });
});
