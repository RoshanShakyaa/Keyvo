"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/get-session";

type UserStats = {
  userId: string;
  userName: string;
  avgWpm: number;
  avgAccuracy: number;
  avgConsistency: number;
  totalTests: number;
  preferredMode: string;
  preferredDuration: number;
};

type UserVector = {
  userId: string;
  userName: string;
  features: number[];
  rawStats: UserStats;
};

type SuggestedFriend = {
  userId: string;
  userName: string;
  avgWpm: number;
  avgAccuracy: number;
  avgConsistency: number;
  totalTests: number;
  similarityScore: number;
};

// STEP 1: Define feature weights (must sum to 1.0)
const FEATURE_WEIGHTS = {
  wpm: 0.4, // 40% - Most important for balanced races
  accuracy: 0.3, // 30% - Skill level indicator
  consistency: 0.2, // 20% - Play style similarity
  duration: 0.1, // 10% - Preference match
};

// STEP 2: Normalize features to 0-100 scale
function normalizeFeatures(stats: UserStats): number[] {
  return [
    Math.min(100, (stats.avgWpm / 150) * 100), // WPM (max 150)
    stats.avgAccuracy, // Already 0-100
    stats.avgConsistency, // Already 0-100
    Math.min(100, (stats.preferredDuration / 180) * 100), // Duration (max 180s)
  ];
}

// STEP 3: Calculate Weighted Euclidean Distance
function calculateDistance(user1: UserVector, user2: UserVector): number {
  const weights = [
    FEATURE_WEIGHTS.wpm,
    FEATURE_WEIGHTS.accuracy,
    FEATURE_WEIGHTS.consistency,
    FEATURE_WEIGHTS.duration,
  ];

  // Sum of weighted squared differences
  const sumWeightedSquaredDiffs = user1.features.reduce((sum, val, i) => {
    const diff = val - user2.features[i];
    return sum + weights[i] * (diff * diff);
  }, 0);

  // Return square root (Euclidean distance)
  return Math.sqrt(sumWeightedSquaredDiffs);
}

// STEP 4: Convert distance to similarity score (0-100)
function distanceToSimilarity(distance: number): number {
  // Lower distance = higher similarity
  // Max expected distance ≈ 100 (all features maximally different)
  return Math.round(Math.max(0, 100 - distance));
}

// Get user's typing stats from test results
async function getUserStats(userId: string): Promise<UserStats | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  if (!user) return null;

  // Get recent test results (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const results = await prisma.testResult.findMany({
    where: {
      userId,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // Last 50 tests
  });

  if (results.length === 0) return null;

  // Calculate averages
  const avgWpm = Math.round(
    results.reduce((sum, r) => sum + r.wpm, 0) / results.length,
  );

  const avgAccuracy =
    results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;

  const avgConsistency =
    results.reduce((sum, r) => sum + r.consistency, 0) / results.length;

  // Find preferred mode/duration (most frequently used)
  const modeCounts: Record<string, number> = {};
  const durationCounts: Record<number, number> = {};

  results.forEach((r) => {
    modeCounts[r.mode] = (modeCounts[r.mode] || 0) + 1;
    durationCounts[r.duration] = (durationCounts[r.duration] || 0) + 1;
  });

  const preferredMode = Object.keys(modeCounts).reduce((a, b) =>
    modeCounts[a] > modeCounts[b] ? a : b,
  );

  const preferredDuration = Number(
    Object.keys(durationCounts).reduce((a, b) =>
      durationCounts[Number(a)] > durationCounts[Number(b)] ? a : b,
    ),
  );

  return {
    userId,
    userName: user.name || "Anonymous",
    avgWpm,
    avgAccuracy,
    avgConsistency,
    totalTests: results.length,
    preferredMode,
    preferredDuration,
  };
}

// Create user vector (normalized features)
function createUserVector(stats: UserStats): UserVector {
  return {
    userId: stats.userId,
    userName: stats.userName,
    features: normalizeFeatures(stats),
    rawStats: stats,
  };
}

// MAIN FUNCTION: K-Nearest Neighbors Friend Suggestions
export async function getSuggestedFriends(
  k: number = 10,
): Promise<SuggestedFriend[]> {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Unauthorized");

  // STEP 1: Get current user's stats
  const currentUserStats = await getUserStats(session.user.id);
  if (!currentUserStats) {
    return []; // User has no test history yet
  }

  // STEP 2: Get existing friendships to exclude
  const existingFriendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: session.user.id }, { addresseeId: session.user.id }],
      status: { in: ["ACCEPTED", "PENDING"] },
    },
    select: {
      requesterId: true,
      addresseeId: true,
    },
  });

  const friendIds = new Set(
    existingFriendships.flatMap((f) => [f.requesterId, f.addresseeId]),
  );
  friendIds.delete(session.user.id); // Remove self

  // STEP 3: Get active users (raced in last 30 days, not already friends)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeUsers = await prisma.testResult.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      userId: {
        notIn: [session.user.id, ...Array.from(friendIds)],
      },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  // STEP 4: Build user vectors
  const currentUserVector = createUserVector(currentUserStats);

  const candidateVectors = await Promise.all(
    activeUsers.map(async ({ userId }) => {
      const stats = await getUserStats(userId);
      return stats ? createUserVector(stats) : null;
    }),
  );

  const validCandidates = candidateVectors.filter(
    (v): v is UserVector => v !== null,
  );

  // STEP 5: Calculate distances for all candidates
  const rankedCandidates = validCandidates.map((candidate) => {
    const distance = calculateDistance(currentUserVector, candidate);

    return {
      userId: candidate.rawStats.userId,
      userName: candidate.rawStats.userName,
      avgWpm: candidate.rawStats.avgWpm,
      avgAccuracy: Math.round(candidate.rawStats.avgAccuracy),
      avgConsistency: Math.round(candidate.rawStats.avgConsistency),
      totalTests: candidate.rawStats.totalTests,
      distance,
      similarityScore: distanceToSimilarity(distance),
    };
  });

  // STEP 6: Sort by distance (ascending) and return top K
  return rankedCandidates
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k)
    .map(({ distance, ...rest }) => rest);
}
