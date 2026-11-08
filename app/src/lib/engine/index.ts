// The only place in the app that imports the civ-core WASM package (built by `pnpm build:wasm`).
// The .wasm file must be downloaded and started once before any function can be called.

import initializeWasm, { describeEngine } from "civ-wasm";

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
