// The simulator's data: a whole match played in the browser by civ-core (WASM), for the policies
// and seed the player chose. Runs again whenever the request changes.

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { simulateMatchInBrowser } from "../lib/engine";
import { seedBytesFromHex } from "../model/map";
import type { SimulationResult } from "../types/map";

/** What to simulate: a seed (hex text) and every bot's YAML, yours first. */
export type SimulationRequest = { seedHex: string; botsYaml: string[] };

/** Plays the requested match. Errors if the seed isn't hex or a policy doesn't compile. */
export function useSimulation(request: SimulationRequest): UseQueryResult<SimulationResult> {
  return useQuery({
    queryKey: ["simulation", request.seedHex, ...request.botsYaml],
    queryFn: () => {
      const seed = seedBytesFromHex(request.seedHex);
      if (seed === null) throw new Error("invalid seed");
      return simulateMatchInBrowser(seed, request.botsYaml);
    },
    staleTime: Infinity, // the same seed and policies always play out the same way
    retry: false,
  });
}
