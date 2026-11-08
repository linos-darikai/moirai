// The only place in the app that imports the civ-core WASM package (built by `pnpm build:wasm`).
// The .wasm file must be downloaded and started once before any function can be called.

import initializeWasm, { compilePolicy, describeEngine, mapTiles, policyProblems, simulateMatch } from "civ-wasm";
import { parseCompilerProblems } from "../../model/compilerProblems";
import { decodeMapBytes } from "../../model/map";
import type { MapTile, SimulatedCiv, SimulationResult } from "../../types/map";
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

/** Numbers per civ in the engine's `civStats` (crates/civ-wasm CIV_STAT_COUNT), in order. */
const CIV_STAT_COUNT = 9;

/** One civ's numbers from the engine's flat list. */
function simulatedCiv(stats: Float64Array | number[], civ: number): SimulatedCiv {
  const at = (offset: number): number => stats[civ * CIV_STAT_COUNT + offset] ?? 0;
  return { isAlive: at(0) === 1, tiles: at(1), cities: at(2), army: at(3), food: at(4), ore: at(5), gold: at(6), coins: at(7), wealth: at(8) };
}

/**
 * Plays a whole match in the browser with civ-core (WASM): the bots' YAML in civ order (yours
 * first) and a 32-byte seed. Every turn is recorded. Throws the compiler's problems if a bot's
 * YAML doesn't compile.
 */
export async function simulateMatchInBrowser(seed: Uint8Array, botsYaml: string[]): Promise<SimulationResult> {
  await ensureEngineReady();
  const simulation = simulateMatch(seed, botsYaml);
  try {
    const turns: SimulationResult["turns"] = [];
    for (let index = 0; index < simulation.snapshotCount(); index++) {
      const stats = simulation.civStats(index);
      turns.push({
        tiles: decodeMapBytes(simulation.mapTiles(index)),
        civs: botsYaml.map((_, civ) => simulatedCiv(stats, civ)),
      });
    }
    return { turns, yourRuleCounts: Array.from(simulation.ruleCounts(0)), fingerprint: simulation.fingerprint() };
  } finally {
    // The simulation lives in WASM memory until freed.
    simulation.free();
  }
}
