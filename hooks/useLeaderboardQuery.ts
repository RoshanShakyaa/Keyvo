"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getLeaderboard,
  getFilteredLeaderboard,
  getUserLeaderboardPosition,
} from "@/app/actions/leaderboard";

// Query keys
export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  lists: () => [...leaderboardKeys.all, "list"] as const,
  list: (filters: {
    sortBy?: "bestWpm" | "avgWpm" | "totalTests";
    timeRange?: "today" | "week" | "month" | "all";
    mode?: "time" | "words";
    duration?: number;
  }) => [...leaderboardKeys.lists(), filters] as const,
  userPosition: (userId: string) =>
    [...leaderboardKeys.all, "position", userId] as const,
};

// Get leaderboard (simple)
export function useLeaderboard(
  sortBy: "bestWpm" | "avgWpm" | "totalTests" = "bestWpm",
  limit: number = 50
) {
  return useQuery({
    queryKey: leaderboardKeys.list({ sortBy }),
    queryFn: async () => {
      const result = await getLeaderboard(sortBy, limit);
      if (!result.success) throw new Error(result.error);
      return result.leaderboard || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}

// Get filtered leaderboard
export function useFilteredLeaderboard(filters: {
  mode?: "time" | "words";
  duration?: number;
  timeRange?: "today" | "week" | "month" | "all";
  limit?: number;
}) {
  return useQuery({
    queryKey: leaderboardKeys.list(filters),
    queryFn: async () => {
      const result = await getFilteredLeaderboard(filters);
      if (!result.success) throw new Error(result.error);
      return result.leaderboard || [];
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Get user position
export function useUserLeaderboardPosition(userId?: string) {
  return useQuery({
    queryKey: userId
      ? leaderboardKeys.userPosition(userId)
      : ["leaderboard", "position", "none"],
    queryFn: async () => {
      if (!userId) return null;
      const result = await getUserLeaderboardPosition(userId);
      if (!result.success) throw new Error(result.error);
      return result.position;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
