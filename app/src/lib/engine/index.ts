// The only place in the app that imports the civ-core WASM package (built by `pnpm build:wasm`).
// The .wasm file must be downloaded and started once before any function can be called.

import initializeWasm, { compilePolicy, describeEngine, mapTiles, policyProblems } from "civ-wasm";
import { parseCompilerProblems } from "../../model/compilerProblems";
import { decodeMapBytes } from "../../model/map";
import type { MapTile } from "../../types/map";
import type { CompiledPolicy } from "../../types/policy";

let readyPromise: Promise<void> | null = null;

/** Loads and starts the WASM module the first time; later calls reuse the same promise. */
function ensureEngineReady(): Promise<void> {
  if (readyPromise === null) {
    readyPromise = initializeWasm().then(() => undefined);
  }
  return readyPromise;
}

/** Returns civ-core's engine description, computed by the WASM build in the browser. */
export async function getEngineDescription(): Promise<string> {
  await ensureEngineReady();
  return describeEngine();
}

/** Generates the starting map with civ-core (in WASM) for a 32-byte seed and 1-4 civs. */
export async function generateStartingMap(seed: Uint8Array, civCount: number): Promise<MapTile[]> {
  await ensureEngineReady();
  return decodeMapBytes(mapTiles(seed, civCount));
}

/** Compiles a YAML policy with civ-core's real compiler (in WASM): the bytes a player commits to,
 * or every problem with its line. */
export async function compilePolicyDraft(yaml: string): Promise<CompiledPolicy> {
  await ensureEngineReady();
  const problems = parseCompilerProblems(policyProblems(yaml));
  if (problems.length > 0) return { isValid: false, problems };
  return { isValid: true, bytes: compilePolicy(yaml) };
}
