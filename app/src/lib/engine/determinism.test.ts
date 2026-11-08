// @vitest-environment node
// Determinism check (CLAUDE.md section 6): the WASM build of civ-core must generate exactly the
// same map, and play exactly the same match, as native Rust. The expected values are the
// KNOWN_FINGERPRINT_FOR_SEED_42 constants in crates/civ-core/src/map_generation.rs (the map) and
// crates/civ-core/tests/sample_bots_match.rs (a full 60-turn match between the four sample bots
// in policies/); if one changes, both must change together.
// Runs in Node (not jsdom) so it can read the .wasm file straight from disk.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it } from "vitest";
import { compilePolicy, initSync, mapFingerprint, matchFingerprint, simulateMatch } from "civ-wasm";

const NATIVE_FINGERPRINT_FOR_SEED_42 = "14264378160424497879";
const NATIVE_MATCH_FINGERPRINT_FOR_SEED_42 = "8239992931703824454";

/** The four sample bots, read from the repo's policies/ folder, in join order. */
function sampleBots(): string[] {
  const files = ["turtle.yaml", "raider.yaml", "trader.yaml", "expander.yaml"];
  return files.map((file) => readFileSync(new URL(`../../../../policies/${file}`, import.meta.url), "utf8"));
}

describe("civ-core WASM determinism", () => {
  beforeAll(() => {
    // Find civ_wasm_bg.wasm next to the package's JavaScript and load it synchronously.
    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve("civ-wasm/civ_wasm_bg.wasm");
    initSync({ module: readFileSync(wasmPath) });
  });

  it("generates the same map as native Rust for a known seed", () => {
    const seed = new Uint8Array(32).fill(42);

    const fingerprint = mapFingerprint(seed, 4);

    expect(fingerprint).toBe(NATIVE_FINGERPRINT_FOR_SEED_42);
  });

  it("plays the 60-turn sample-bot match exactly like native Rust", () => {
    const seed = new Uint8Array(32).fill(42);

    const fingerprint = matchFingerprint(seed, sampleBots());

    expect(fingerprint).toBe(NATIVE_MATCH_FINGERPRINT_FOR_SEED_42);
  });

  it("simulates the sample match turn by turn and ends in the native state", () => {
    const seed = new Uint8Array(32).fill(42);

    const simulation = simulateMatch(seed, sampleBots());

    expect(simulation.snapshotCount()).toBe(61);
    expect(simulation.mapTiles(60)).toHaveLength(768);
    expect(simulation.fingerprint()).toBe(NATIVE_MATCH_FINGERPRINT_FOR_SEED_42);
    simulation.free();
  });

  it("compiles a policy and reports problems with their line", () => {
    const valid = "name: t\nrules:\n  - if: always\n    do: build(worker)\n";
    const broken = "name: t\nrules:\n  - if: mana > 3\n    do: build(worker)\n";

    expect(compilePolicy(valid)[0]).toBe("M".charCodeAt(0));
    expect(() => compilePolicy(broken)).toThrow("line 3: unknown value `mana`");
  });

  it("rejects a seed that is not 32 bytes", () => {
    const shortSeed = new Uint8Array(8);

    expect(() => mapFingerprint(shortSeed, 4)).toThrow(/32 bytes/);
  });
});
