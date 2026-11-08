// Match data hooks: a live match, its replay moments and its results.
// SAMPLE DATA until Phase 2/3: replace with reads of the Match, Civ, Map and Market accounts (live
// via accountSubscribe) and, for replay, the match's turn transactions.

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { SAMPLE_MATCH, SAMPLE_REPLAY_MOMENTS, SAMPLE_RESULTS } from "../data/matches";
import type { MatchDetail, MatchResults, ReplayMoment } from "../types/game";
import { SAMPLE_KEY, sampleQueryFn } from "./sampleQuery";

/** A match's current state: civs, feed and market. */
export function useMatch(matchId: string): UseQueryResult<MatchDetail> {
  return useQuery({
    queryKey: [SAMPLE_KEY, "match", matchId],
    queryFn: sampleQueryFn({ ...SAMPLE_MATCH, id: matchId }),
  });
}

/** The labelled key moments on a finished match's timeline. */
export function useReplayMoments(matchId: string): UseQueryResult<ReplayMoment[]> {
  return useQuery({
    queryKey: [SAMPLE_KEY, "replayMoments", matchId],
    queryFn: sampleQueryFn([...SAMPLE_REPLAY_MOMENTS]),
  });
}

/** A settled match's standings, payouts and settlement transactions. */
export function useMatchResults(matchId: string): UseQueryResult<MatchResults> {
  return useQuery({
    queryKey: [SAMPLE_KEY, "results", matchId],
    queryFn: sampleQueryFn({ ...SAMPLE_RESULTS, id: matchId }),
  });
}
