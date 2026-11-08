// @vitest-environment node
// compilePolicyDraft runs civ-core's real compiler in WASM. Runs in Node (not jsdom) so the
// .wasm file can be read straight from disk, like determinism.test.ts.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it } from "vitest";
import { initSync } from "civ-wasm";
import { compilePolicyDraft } from ".";

describe("compilePolicyDraft", () => {
  beforeAll(() => {
    const require = createRequire(import.meta.url);
    initSync({ module: readFileSync(require.resolve("civ-wasm/civ_wasm_bg.wasm")) });
  });

  it("gives the compiled bytes for a valid policy", async () => {
    const result = await compilePolicyDraft("name: t\nrules:\n  - if: always\n    do: build(worker)\n");

    expect(result.isValid).toBe(true);
    if (result.isValid) expect(result.bytes[0]).toBe("M".charCodeAt(0));
  });

  it("gives every problem with its line and code", async () => {
    const result = await compilePolicyDraft("rules:\n  - if: mana > 3\n    do: cast(fire)\n");

    expect(result).toEqual({
      isValid: false,
      problems: [
        { line: 0, code: "missingName", detail: "" },
        { line: 2, code: "unknownValue", detail: "mana" },
        { line: 3, code: "unknownAction", detail: "cast" },
      ],
    });
  });
});
