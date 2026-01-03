"use server";

import { prisma } from "@/lib/prisma";

// Common leaderboard entry type
export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  bestWpm: number;
  avgWpm: number;
  avgAccuracy: number;
  avgConsistency: number;
  totalTests: number;
  lastActive: Date;
};

export async function getLeaderboard(
  sortBy: "bestWpm" | "avgWpm" | "totalTests" = "bestWpm",
  limit: number = 50
) {
  try {
    const leaderboard = await prisma.userStats.findMany({
      where: {
        totalTests: {
          gte: 5,
        },
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true,
          },
        },
        bestWpm: true,
        avgWpm: true,
        avgAccuracy: true,
        avgConsistency: true,
        totalTests: true,
        updatedAt: true,
      },
      orderBy: {
        [sortBy]: "desc",
      },
      take: limit,
    });

    const rankedLeaderboard: LeaderboardEntry[] = leaderboard.map(
      (entry, index) => ({
        rank: index + 1,
        userId: entry.user.id,
        name: entry.user.name || "Anonymous",
        image: entry.user.image,
        bestWpm: entry.bestWpm,
        avgWpm: Math.round(entry.avgWpm),
        avgAccuracy: Math.round(entry.avgAccuracy),
        avgConsistency: Math.round(entry.avgConsistency),
        totalTests: entry.totalTests,
        lastActive: entry.updatedAt,
      })
    );

    return { success: true, leaderboard: rankedLeaderboard };
  } catch (error) {
    console.error("Failed to get leaderboard:", error);
    return { success: false, error: "Failed to fetch leaderboard" };
  }
}

export async function getUserLeaderboardPosition(userId: string) {
  try {
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
      select: { bestWpm: true },
    });

    if (!userStats) {
      return { success: true, position: null };
    }

    const betterUsers = await prisma.userStats.count({
      where: {
        bestWpm: {
          gt: userStats.bestWpm,
        },
        totalTests: {
          gte: 5,
        },
      },
    });

    const position = betterUsers + 1;

    return { success: true, position };
  } catch (error) {
    console.error("Failed to get user position:", error);
    return { success: false, error: "Failed to fetch position" };
  }
}

export async function getFilteredLeaderboard(filters: {
  mode?: "time" | "words";
  duration?: number;
  timeRange?: "today" | "week" | "month" | "all";
  limit?: number;
}) {
  try {
    const { mode, duration, timeRange = "all", limit = 50 } = filters;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dateFilter: any = {};
    if (timeRange !== "all") {
      const now = new Date();
      if (timeRange === "today") {
        dateFilter = { gte: new Date(now.setHours(0, 0, 0, 0)) };
      } else if (timeRange === "week") {
        dateFilter = { gte: new Date(now.setDate(now.getDate() - 7)) };
      } else if (timeRange === "month") {
        dateFilter = { gte: new Date(now.setMonth(now.getMonth() - 1)) };
      }
    }

    const results = await prisma.testResult.groupBy({
      by: ["userId"],
      where: {
        ...(mode && { mode }),
        ...(duration && { duration }),
        ...(timeRange !== "all" && { createdAt: dateFilter }),
      },
      _max: {
        wpm: true,
      },
      _avg: {
        accuracy: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _max: {
          wpm: "desc",
        },
      },
      take: limit,
    });

    const leaderboard = await Promise.all(
      results.map(async (result, index) => {
        const user = await prisma.user.findUnique({
          where: { id: result.userId },
          select: {
            id: true,
            name: true,
            image: true,
          },
        });

        // Return normalized LeaderboardEntry format
        return {
          rank: index + 1,
          userId: result.userId,
          name: user?.name || "Anonymous",
          image: user?.image || null,
          bestWpm: result._max.wpm || 0,
          avgWpm: result._max.wpm || 0, // Filtered results only have max
          avgAccuracy: Math.round(result._avg.accuracy || 0),
          avgConsistency: 0, // Not available in filtered results
          totalTests: result._count.id,
          lastActive: new Date(), // Not available in filtered results
        } as LeaderboardEntry;
      })
    );

    return { success: true, leaderboard };
  } catch (error) {
    console.error("Failed to get filtered leaderboard:", error);
    return { success: false, error: "Failed to fetch leaderboard" };
  }
}
