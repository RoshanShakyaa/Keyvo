"use client";

import React from "react";
import { Trophy, Target, Zap, Clock, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getRaceStatsQueryOptions, getRecentRacesQueryOptions, getRecentTestsQueryOptions,  } from "@/hooks/useQueryOptions";
import { getUserStatsQueryOptions } from "@/hooks/useQueryOptions";


type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  createdAt: Date | string;
};

export function ProfileClient({ user }: { user: User }) {
const { data: statsRes, isPending: statsPending } = useQuery(getUserStatsQueryOptions(user.id));
const { data: testsRes, isPending: testsPending } = useQuery(getRecentTestsQueryOptions(user.id));
const { data: racesRes, isPending: racesPending } = useQuery(getRecentRacesQueryOptions(user.id));
const { data: raceStatsRes, isPending: raceStatsPending } = useQuery(getRaceStatsQueryOptions(user.id));

  const stats = statsRes?.success ? statsRes.stats : null;
  const recentTests = testsRes?.success && testsRes.tests ? testsRes.tests : [];
  const recentRaces = racesRes?.success && racesRes.races ? racesRes.races : [];
  const raceStats = raceStatsRes?.success ? raceStatsRes.stats : null;

  const getPositionEmoji = (position: number) => {
    switch (position) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `#${position}`;
    }
  };

  const getPositionBgColor = (position: number) => {
    switch (position) {
      case 1: return "bg-yellow-500/10 text-yellow-500";
      case 2: return "bg-gray-400/10 text-gray-400";
      case 3: return "bg-orange-600/10 text-orange-600";
      default: return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="flex-1 pt-12 max-w-6xl mx-auto px-4 pb-12 text-foreground">
      {/* Profile Header */}
      <div className="w-full rounded-lg p-6 border bg-card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-20 md:size-24 rounded-full  from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center">
              <span className="text-3xl md:text-4xl font-bold text-primary">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                Joined{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
{statsPending || raceStatsPending ? (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="rounded-lg border bg-background p-4 animate-pulse space-y-2">
        <div className="h-5 w-5 bg-muted rounded" />
        <div className="h-8 w-16 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    ))}
  </div>
) : (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
     <StatCard icon={<Trophy className="size-5" />} label="Best WPM" value={Math.round(stats?.bestWpm || 0)} color="text-yellow-500" />
        <StatCard icon={<Zap className="size-5" />} label="Avg WPM" value={Math.round(stats?.avgWpm || 0)} color="text-primary" />
        <StatCard icon={<Target className="size-5" />} label="Avg Accuracy" value={`${Math.round(stats?.avgAccuracy || 0)}%`} color="text-green-500" />
        <StatCard icon={<Clock className="size-5" />} label="Tests" value={stats?.totalTests || 0} color="text-blue-500" />
        <StatCard icon={<Users className="size-5" />} label="Races" value={raceStats?.totalRaces || 0} color="text-purple-500" />
  </div>
)}
      

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tests */}
        <div className="w-full rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold mb-4">Recent Tests</h2>
          <div className="space-y-3">
            {testsPending ? (
    // Skeleton
    Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 gap-3 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-full bg-muted shrink-0" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-8 w-10 bg-muted rounded" />
          <div className="h-8 w-10 bg-muted rounded" />
        </div>
      </div>
    ))
  ):  recentTests.length > 0 ? (
              recentTests.map((test, index) => (
                <div key={test.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors gap-3">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg">{test.wpm} WPM</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{test.accuracy}% acc</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {test.mode === "time" ? `${test.duration}s` : `${test.duration} words`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(test.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
              <p className="text-sm text-muted-foreground">No tests taken yet.</p>
            )
        }
          </div>
        </div>

        {/* Recent Races */}
        <div className="w-full rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold mb-4">Recent Races</h2>
          
          <div className="space-y-3">
            {racesPending ? (
    Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 gap-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-muted shrink-0" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="h-4 w-16 bg-muted rounded" />
      </div>
    ))
  ):
            recentRaces.length > 0 ? (
              recentRaces.map((race) => (
                <div key={race.id} className="flex flex-col p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${getPositionBgColor(race.userPerformance.position || 0)}`}>
                        <span className="text-lg font-bold">{getPositionEmoji(race.userPerformance.position || 0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-lg">{race.userPerformance.wpm} WPM</span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{race.userPerformance.accuracy}% acc</span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{race.duration}s</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(race.finishedAt || race.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {race.totalParticipants} {race.totalParticipants === 1 ? "racer" : "racers"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg opacity-50">
                <Users className="size-8 mb-2" />
                <p className="text-sm">No races completed yet</p>
              </div>
            )
        }
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl md:text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}