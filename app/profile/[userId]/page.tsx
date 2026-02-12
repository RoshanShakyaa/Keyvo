import React from "react";
import { Trophy, Target, Zap, Clock, Users } from "lucide-react";
import { getServerSession } from "@/lib/get-session"; // Adjust based on your auth helper
import {
  getRecentRaces,
  getUserStats,
  getRecentTests,
  getRaceStats,
  getUserById, // New action
} from "@/app/actions/test-results";

const ProfilePage = async ({
  params,
}: {
  params: Promise<{ userId?: string }>; // Optional userId
}) => {
  const resolvedParams = await params;
  const session = await getServerSession();

  // 1. Determine which ID to fetch: URL param OR Session ID
  const targetUserId = resolvedParams.userId || session?.user?.id;

  if (!targetUserId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">
          User not found or not logged in.
        </p>
      </div>
    );
  }

  // 2. Fetch all data including the specific user's info
  const [userRes, statsRes, testsRes, racesRes, raceStatsRes] =
    await Promise.all([
      getUserById(targetUserId),
      getUserStats(targetUserId),
      getRecentTests(targetUserId, 5),
      getRecentRaces(targetUserId, 5),
      getRaceStats(targetUserId),
    ]);

  if (!userRes.success || !userRes.user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const user = userRes.user;
  const stats = statsRes.success ? statsRes.stats : null;
  const recentTests = testsRes.success && testsRes.tests ? testsRes.tests : [];
  const recentRaces = racesRes.success && racesRes.races ? racesRes.races : [];
  const raceStats = raceStatsRes.success ? raceStatsRes.stats : null;

  // Helper functions for UI (Positioning colors/emojis)
  const getPositionEmoji = (pos: number) => {
    if (pos === 1) return "🥇";
    if (pos === 2) return "🥈";
    if (pos === 3) return "🥉";
    return `#${pos}`;
  };

  const getPositionBgColor = (pos: number) => {
    if (pos === 1) return "bg-yellow-500/10 text-yellow-500";
    if (pos === 2) return "bg-gray-400/10 text-gray-400";
    if (pos === 3) return "bg-orange-600/10 text-orange-600";
    return "bg-primary/10 text-primary";
  };

  return (
    <div className="flex-1 pt-12 max-w-6xl mx-auto px-4 pb-12 text-foreground">
      {/* Profile Header */}
      <div className="w-full rounded-lg p-6 border bg-card mb-6">
        <div className="flex items-center gap-4">
          <div className="size-20 md:size-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center">
            <span className="text-3xl md:text-4xl font-bold text-primary">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
            {/* Show email only if it's the user's own profile for privacy */}
            {session?.user?.id === user.id && (
              <p className="text-muted-foreground text-sm">{user.email}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Joined{" "}
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={<Trophy className="size-5" />}
          label="Best WPM"
          value={Math.round(stats?.bestWpm || 0)}
          color="text-yellow-500"
        />
        <StatCard
          icon={<Zap className="size-5" />}
          label="Avg WPM"
          value={Math.round(stats?.avgWpm || 0)}
          color="text-primary"
        />
        <StatCard
          icon={<Target className="size-5" />}
          label="Avg Accuracy"
          value={`${Math.round(stats?.avgAccuracy || 0)}%`}
          color="text-green-500"
        />
        <StatCard
          icon={<Clock className="size-5" />}
          label="Tests"
          value={stats?.totalTests || 0}
          color="text-blue-500"
        />
        <StatCard
          icon={<Users className="size-5" />}
          label="Races"
          value={raceStats?.totalRaces || 0}
          color="text-purple-500"
        />
      </div>

      {/* Grid for Tests and Races (using your existing map logic) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Real Recent Tests */}

        <div className="w-full rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold mb-4">Recent Tests</h2>

          <div className="space-y-3">
            {recentTests.length > 0 ? (
              recentTests.map((test, index) => (
                <div
                  key={test.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        #{index + 1}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg">
                          {test.wpm} WPM
                        </span>

                        <span className="text-sm text-muted-foreground">•</span>

                        <span className="text-sm text-muted-foreground">
                          {test.accuracy}% acc
                        </span>

                        <span className="text-sm text-muted-foreground">•</span>

                        <span className="text-sm text-muted-foreground">
                          {test.mode === "time"
                            ? `${test.duration}s`
                            : `${test.duration} words`}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(test.createdAt).toLocaleDateString("en-US", {
                          month: "short",

                          day: "numeric",

                          hour: "2-digit",

                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Raw</p>

                      <p className="font-semibold">{test.rawWpm}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-xs">Errors</p>

                      <p className="font-semibold">{test.errors}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No tests taken yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Races Section */}

        <div className="w-full rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold mb-4">Recent Races</h2>

          <div className="space-y-3">
            {recentRaces.length > 0 ? (
              recentRaces.map((race) => (
                <div
                  key={race.id}
                  className="flex flex-col p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-10 rounded-full flex items-center justify-center shrink-0 ${getPositionBgColor(
                          race.userPerformance.position || 0,
                        )}`}
                      >
                        <span className="text-lg font-bold">
                          {getPositionEmoji(race.userPerformance.position || 0)}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-lg">
                            {race.userPerformance.wpm} WPM
                          </span>

                          <span className="text-sm text-muted-foreground">
                            •
                          </span>

                          <span className="text-sm text-muted-foreground">
                            {race.userPerformance.accuracy}% acc
                          </span>

                          <span className="text-sm text-muted-foreground">
                            •
                          </span>

                          <span className="text-sm text-muted-foreground">
                            {race.duration}s
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(
                            race.finishedAt || race.createdAt,
                          ).toLocaleDateString("en-US", {
                            month: "short",

                            day: "numeric",

                            hour: "2-digit",

                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {race.totalParticipants}{" "}
                      {race.totalParticipants === 1 ? "racer" : "racers"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg opacity-50">
                <Users className="size-8 mb-2" />

                <p className="text-sm">No races completed yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl md:text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default ProfilePage;
