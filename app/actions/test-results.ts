"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { success } from "zod";

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
    const session = await auth.api.getSession();

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
