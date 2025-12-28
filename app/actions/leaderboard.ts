"use server";

import { prisma } from "@/lib/prisma";

export async function getLeaderboard(
  sortBy: "bestWpm" | "avgWpm" | "totalTests" = "bestWpm",
  limit: number = 50
) {
  try {
    const leaderboard = await prisma.userStats.findMany({
      where: {
        totalTests: {
          gte: 5, // Only show users with at least 5 tests (prevents one-hit wonders)
        },
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            image: true, // For avatar
            createdAt: true,
          },
        },
        bestWpm: true,
        avgWpm: true,
        avgAccuracy: true,
        avgConsistency: true,
        totalTests: true,
        updatedAt: true, // When they last tested
      },
      orderBy: {
        [sortBy]: "desc",
      },
      take: limit,
    });

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user.id,
      name: entry.user.name || "Anonymous",
      image: entry.user.image,
      joinedAt: entry.user.createdAt,
      bestWpm: entry.bestWpm,
      avgWpm: Math.round(entry.avgWpm),
      avgAccuracy: Math.round(entry.avgAccuracy),
      avgConsistency: Math.round(entry.avgConsistency),
      totalTests: entry.totalTests,
      lastActive: entry.updatedAt,
    }));

    return { success: true, leaderboard: rankedLeaderboard };
  } catch (error) {
    console.error("Failed to get leaderboard:", error);
    return { success: false, error: "Failed to fetch leaderboard" };
  }
}

// Get user's position in leaderboard
export async function getUserLeaderboardPosition(userId: string) {
  try {
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
      select: { bestWpm: true },
    });

    if (!userStats) {
      return { success: true, position: null };
    }

    // Count how many users have better WPM
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

// Get leaderboard with filters (time period, mode)
export async function getFilteredLeaderboard(filters: {
  mode?: "time" | "words";
  duration?: number; // 15, 30, 60, 120
  timeRange?: "today" | "week" | "month" | "all";
  limit?: number;
}) {
  try {
    const { mode, duration, timeRange = "all", limit = 50 } = filters;

    // Build date filter
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

    // Get best result per user with filters
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

    // Fetch user details
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

        return {
          rank: index + 1,
          userId: result.userId,
          name: user?.name || "Anonymous",
          image: user?.image,
          wpm: result._max.wpm || 0,
          avgAccuracy: Math.round(result._avg.accuracy || 0),
          testCount: result._count.id,
        };
      })
    );

    return { success: true, leaderboard };
  } catch (error) {
    console.error("Failed to get filtered leaderboard:", error);
    return { success: false, error: "Failed to fetch leaderboard" };
  }
}

export type LeaderboardEntryType = Awaited<
  ReturnType<typeof getFilteredLeaderboard>
>;
