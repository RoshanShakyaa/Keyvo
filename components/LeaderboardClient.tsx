"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Target,
  Zap,
  Crown,
} from "lucide-react";
import {
  useLeaderboard,
  useFilteredLeaderboard,
  useUserLeaderboardPosition,
} from "@/hooks/useLeaderboardQuery";
import type { LeaderboardEntry } from "@/app/actions/leaderboard";

type FilterOptions = {
  sortBy: "bestWpm" | "avgWpm" | "totalTests";
  timeRange: "today" | "week" | "month" | "all";
  mode?: "time" | "words";
  duration?: number;
};

type Props = {
  currentUserId?: string;
};

export default function LeaderboardClient({ currentUserId }: Props) {
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "bestWpm",
    timeRange: "all",
  });

  const useSimpleLeaderboard =
    filters.timeRange === "all" && !filters.mode && !filters.duration;

  const simpleQuery = useLeaderboard(filters.sortBy, 50);
  const filteredQuery = useFilteredLeaderboard({
    mode: filters.mode,
    duration: filters.duration,
    timeRange: filters.timeRange,
    limit: 50,
  });

  const {
    data: leaderboard = [],
    isLoading,
    isFetching,
  } = useSimpleLeaderboard ? simpleQuery : filteredQuery;

  const { data: userPosition } = useUserLeaderboardPosition(currentUserId);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="size-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="size-6 text-gray-400" />;
    if (rank === 3) return <Award className="size-6 text-orange-400" />;
    return <span className="text-muted-foreground font-semibold">#{rank}</span>;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isCurrentUser = (userId: string) => userId === currentUserId;

  return (
    <>
      {/* User Position Banner */}
      {currentUserId && userPosition && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Crown className="size-6 text-primary" />
            <div>
              <div className="font-semibold">Your Rank</div>
              <div className="text-sm text-muted-foreground">
                #{userPosition} out of {leaderboard.length}+ typists
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters - same as before */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap gap-3 justify-center"
      >
        <div className="flex gap-2 bg-card border rounded-lg p-1">
          <FilterButton
            active={filters.sortBy === "bestWpm"}
            onClick={() => handleFilterChange({ sortBy: "bestWpm" })}
            icon={<Zap className="size-4" />}
            label="Best WPM"
            disabled={isFetching}
          />
          <FilterButton
            active={filters.sortBy === "avgWpm"}
            onClick={() => handleFilterChange({ sortBy: "avgWpm" })}
            icon={<TrendingUp className="size-4" />}
            label="Avg WPM"
            disabled={isFetching}
          />
          <FilterButton
            active={filters.sortBy === "totalTests"}
            onClick={() => handleFilterChange({ sortBy: "totalTests" })}
            icon={<Target className="size-4" />}
            label="Tests"
            disabled={isFetching}
          />
        </div>

        <div className="flex gap-2 bg-card border rounded-lg p-1">
          <FilterButton
            active={filters.timeRange === "today"}
            onClick={() => handleFilterChange({ timeRange: "today" })}
            label="Today"
            disabled={isFetching}
          />
          <FilterButton
            active={filters.timeRange === "week"}
            onClick={() => handleFilterChange({ timeRange: "week" })}
            label="Week"
            disabled={isFetching}
          />
          <FilterButton
            active={filters.timeRange === "month"}
            onClick={() => handleFilterChange({ timeRange: "month" })}
            label="Month"
            disabled={isFetching}
          />
          <FilterButton
            active={filters.timeRange === "all"}
            onClick={() => handleFilterChange({ timeRange: "all" })}
            label="All Time"
            disabled={isFetching}
          />
        </div>
      </motion.div>

      {/* Loading States */}
      {isFetching && (
        <div className="mb-4 text-center text-sm text-muted-foreground">
          <div className="inline-block animate-spin size-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
          Updating leaderboard...
        </div>
      )}

      {isLoading && (
        <div className="bg-card border rounded-lg p-12 text-center">
          <div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      )}

      {/* Leaderboard Table */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border rounded-lg overflow-hidden"
        >
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b font-semibold text-sm text-muted-foreground">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2 text-center">WPM</div>
            <div className="col-span-2 text-center">Accuracy</div>
            <div className="col-span-2 text-center">Tests</div>
            <div className="col-span-1 text-center">Badge</div>
          </div>

          {leaderboard.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No entries found for selected filters
            </div>
          )}

          {leaderboard.map((entry: LeaderboardEntry, index: number) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors ${
                isCurrentUser(entry.userId)
                  ? "bg-primary/5 border-l-4 border-l-primary"
                  : ""
              }`}
            >
              <div className="col-span-1 flex items-center">
                {getRankIcon(entry.rank)}
              </div>

              <div className="col-span-4 flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                  {getInitials(entry.name)}
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {entry.name}
                    {isCurrentUser(entry.userId) && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.totalTests} tests
                  </div>
                </div>
              </div>

              <div className="col-span-2 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-primary">
                  {entry.bestWpm}
                </div>
                <div className="text-xs text-muted-foreground">
                  avg {entry.avgWpm}
                </div>
              </div>

              <div className="col-span-2 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-semibold">{entry.avgAccuracy}%</div>
                  {entry.avgConsistency > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {entry.avgConsistency}% cons
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2 flex items-center justify-center font-semibold">
                {entry.totalTests}
              </div>

              <div className="col-span-1 flex items-center justify-center">
                {entry.totalTests > 100 && (
                  <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="size-4 text-primary" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          Showing top {leaderboard.length} players
        </motion.div>
      )}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FilterButton({ active, onClick, icon, label, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
