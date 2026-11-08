// @vitest-environment node
// Determinism check (CLAUDE.md section 6): the WASM build of civ-core must generate exactly the
// same map as native Rust. The expected value is KNOWN_FINGERPRINT_FOR_SEED_42 in
// crates/civ-core/src/map_generation.rs; if one changes, both must change together.
// Runs in Node (not jsdom) so it can read the .wasm file straight from disk.

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it } from "vitest";
import { initSync, mapFingerprint } from "civ-wasm";

const NATIVE_FINGERPRINT_FOR_SEED_42 = "13807811971971621171";

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

  it("rejects a seed that is not 32 bytes", () => {
    const shortSeed = new Uint8Array(8);

    expect(() => mapFingerprint(shortSeed, 4)).toThrow(/32 bytes/);
  });
});
