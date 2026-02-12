"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type SaveTestResultInput = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  characters: number;
  errors: number;
  mode: string;
  duration: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData: any[];
};

export async function saveTestResult(data: SaveTestResultInput) {
  const {
    wpm,
    rawWpm,
    accuracy,
    consistency,
    characters,
    errors,
    mode,
    duration,
    chartData,
  } = data;
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user.id) {
      return { success: false, error: "Not authentication" };
    }

    const userId = session.user.id;

    const result = await prisma.testResult.create({
      data: {
        userId,
        wpm,
        rawWpm,
        accuracy,
        consistency,
        characters,
        errors,
        mode,
        duration,
        chartData,
      },
    });

    await updateUserStats(userId);

    return { success: true, result };
  } catch (error) {
    console.error("failed to save test result:", error);
    return { success: false, error: "failed to save result" };
  }
}

async function updateUserStats(userId: string) {
  const allResults = await prisma.testResult.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (allResults.length === 0) return;

  const totalTests = allResults.length;
  const bestWpm = Math.max(...allResults.map((r) => r.wpm));
  const avgWpm = allResults.reduce((sum, r) => sum + r.wpm, 0) / totalTests;
  const avgAccuracy =
    allResults.reduce((sum, r) => sum + r.accuracy, 0) / totalTests;
  const avgConsistency =
    allResults.reduce((sum, r) => sum + r.consistency, 0) / totalTests;

  await prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      totalTests,
      bestWpm,
      avgWpm,
      avgAccuracy,
      avgConsistency,
    },
    update: {
      totalTests,
      bestWpm,
      avgWpm,
      avgAccuracy,
      avgConsistency,
    },
  });
}

export async function getUserStats(userId: string) {
  try {
    const stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    return { success: true, stats };
  } catch (error) {
    console.error("Failed to get user stats:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}

export async function getRecentTests(userId: string, limit: number = 10) {
  try {
    const tests = await prisma.testResult.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return { success: true, tests };
  } catch (error) {
    console.error("Failed to get recent tests:", error);
    return { success: false, error: "failed to fetch tests" };
  }
}

export async function getRecentRaces(userId: string, limit: number = 5) {
  try {
    const races = await prisma.raceParticipant.findMany({
      where: {
        userId,
        race: {
          status: "FINISHED", // Only get completed races
        },
      },
      include: {
        race: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
              orderBy: {
                position: "asc",
              },
            },
            host: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Transform the data for easier consumption
    const formattedRaces = races.map((participant) => ({
      id: participant.race.id,
      code: participant.race.code,
      duration: participant.race.duration,
      finishedAt: participant.finishedAt,
      createdAt: participant.race.createdAt,
      // User's performance
      userPerformance: {
        position: participant.position,
        wpm: participant.wpm,
        accuracy: participant.accuracy,
        progress: participant.progress,
      },
      // All participants
      participants: participant.race.participants.map((p) => ({
        id: p.userId,
        name: p.user.name,
        image: p.user.image,
        position: p.position,
        wpm: p.wpm,
        accuracy: p.accuracy,
        finished: p.finished,
      })),
      totalParticipants: participant.race.participants.length,
      wasHost: participant.race.hostId === userId,
    }));

    return { success: true, races: formattedRaces };
  } catch (error) {
    console.error("Failed to get recent races:", error);
    return { success: false, error: "Failed to fetch races" };
  }
}

export async function getRaceStats(userId: string) {
  try {
    const [totalRaces, wins, topThreeFinishes] = await Promise.all([
      // Total races participated
      prisma.raceParticipant.count({
        where: {
          userId,
          finished: true,
          race: {
            status: "FINISHED",
          },
        },
      }),
      // Total wins (1st place)
      prisma.raceParticipant.count({
        where: {
          userId,
          position: 1,
          race: {
            status: "FINISHED",
          },
        },
      }),
      // Top 3 finishes
      prisma.raceParticipant.count({
        where: {
          userId,
          position: {
            lte: 3,
          },
          race: {
            status: "FINISHED",
          },
        },
      }),
    ]);

    // Get best race WPM
    const bestRace = await prisma.raceParticipant.findFirst({
      where: {
        userId,
        finished: true,
        race: {
          status: "FINISHED",
        },
      },
      orderBy: {
        wpm: "desc",
      },
      select: {
        wpm: true,
      },
    });

    // Calculate average race WPM
    const raceResults = await prisma.raceParticipant.findMany({
      where: {
        userId,
        finished: true,
        race: {
          status: "FINISHED",
        },
      },
      select: {
        wpm: true,
        accuracy: true,
      },
    });

    const avgRaceWpm =
      raceResults.length > 0
        ? raceResults.reduce((sum, r) => sum + r.wpm, 0) / raceResults.length
        : 0;

    const avgRaceAccuracy =
      raceResults.length > 0
        ? raceResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) /
          raceResults.length
        : 0;

    return {
      success: true,
      stats: {
        totalRaces,
        wins,
        topThreeFinishes,
        bestRaceWpm: bestRace?.wpm || 0,
        avgRaceWpm: Math.round(avgRaceWpm),
        avgRaceAccuracy: Math.round(avgRaceAccuracy),
        winRate: totalRaces > 0 ? ((wins / totalRaces) * 100).toFixed(1) : 0,
      },
    };
  } catch (error) {
    console.error("Failed to get race stats:", error);
    return { success: false, error: "Failed to fetch race stats" };
  }
}
