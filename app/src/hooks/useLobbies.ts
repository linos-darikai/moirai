// Lobby data hooks: open lobbies, live matches and one lobby's detail.
// SAMPLE DATA until Phase 2: replace each queryFn with a read of Match accounts through lib/solana.

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { SAMPLE_LIVE_MATCHES, SAMPLE_LOBBIES, SAMPLE_LOBBY_DETAIL } from "../data/lobbies";
import type { LiveMatchSummary, LobbyDetail, LobbySummary, WinMetric } from "../types/game";
import { SAMPLE_KEY, sampleQueryFn } from "./sampleQuery";

/** Open lobbies, optionally only those with one win metric. */
export function useLobbies(metric: WinMetric | "all"): UseQueryResult<LobbySummary[]> {
  return useQuery({
    queryKey: [SAMPLE_KEY, "lobbies"],
    queryFn: sampleQueryFn([...SAMPLE_LOBBIES]),
    select: (lobbies: LobbySummary[]) =>
      metric === "all" ? lobbies : lobbies.filter((lobby) => lobby.metric === metric),
  });
}

/** Matches being played right now. */
export function useLiveMatches(): UseQueryResult<LiveMatchSummary[]> {
  return useQuery({
    queryKey: [SAMPLE_KEY, "liveMatches"],
    queryFn: sampleQueryFn([...SAMPLE_LIVE_MATCHES]),
  });
}

/** One lobby with its seats and activity log. */
export function useLobby(lobbyId: string): UseQueryResult<LobbyDetail> {
  return useQuery({
    queryKey: [SAMPLE_KEY, "lobby", lobbyId],
    queryFn: sampleQueryFn({ ...SAMPLE_LOBBY_DETAIL, id: lobbyId }),
  });
}
