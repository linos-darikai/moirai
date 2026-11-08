// Player data hooks: the leaderboard, the top few players and one player's profile.
// SAMPLE DATA until Phase 2: replace with reads of the Top 10 account and Profile accounts.

import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { SAMPLE_PROFILE, SAMPLE_RANKINGS } from "../data/players";
import type { PlayerProfile, PlayerRanking } from "../types/game";
import { SAMPLE_KEY, sampleQueryFn } from "./sampleQuery";

/** Leaderboard periods. Sample data is the same for every period. */
export type LeaderboardPeriod = "week" | "month" | "allTime";

/** The full rankings for a period. */
export function useLeaderboard(period: LeaderboardPeriod): UseQueryResult<PlayerRanking[]> {
  return useQuery({
    queryKey: [SAMPLE_KEY, "leaderboard", period],
    queryFn: sampleQueryFn([...SAMPLE_RANKINGS]),
  });
}

/** The best `count` players of all time. */
export function useTopPlayers(count: number): UseQueryResult<PlayerRanking[]> {
  return useQuery({
    queryKey: [SAMPLE_KEY, "leaderboard", "allTime"],
    queryFn: sampleQueryFn([...SAMPLE_RANKINGS]),
    select: (rankings: PlayerRanking[]) => rankings.slice(0, count),
  });
}

/** A player's record, policies and match history. */
export function useProfile(wallet: string): UseQueryResult<PlayerProfile> {
  return useQuery({
    queryKey: [SAMPLE_KEY, "profile", wallet],
    queryFn: sampleQueryFn({ ...SAMPLE_PROFILE, wallet }),
  });
}
