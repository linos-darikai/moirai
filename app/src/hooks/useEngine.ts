// Data hook for the civ-core WASM engine. Phase 0: just its description, to prove the browser can
// load and call the WASM build.

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { getEngineDescription } from "../lib/engine";

/** Loads the WASM engine and returns its description string. */
export function useEngineDescription(): UseQueryResult<string> {
  return useQuery({
    queryKey: ["engine", "description"],
    queryFn: getEngineDescription,
    staleTime: Infinity, // the description never changes while the page is open
  });
}
