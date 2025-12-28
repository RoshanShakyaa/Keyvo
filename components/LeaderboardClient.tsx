"use client";

import { useState, useTransition, useEffect } from "react";
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
  getFilteredLeaderboard,
  getLeaderboard,
  getUserLeaderboardPosition,
} from "@/app/actions/leaderboard";

type LeaderboardEntry = {
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

type FilterOptions = {
  sortBy: "bestWpm" | "avgWpm" | "totalTests";
  timeRange: "today" | "week" | "month" | "all";
  mode?: "time" | "words";
  duration?: number;
};

type Props = {
  initialData: LeaderboardEntry[];
  currentUserId?: string;
};

export default function LeaderboardClient({
  initialData,
  currentUserId,
}: Props) {
  const [leaderboard, setLeaderboard] = useState(initialData);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "bestWpm",
    timeRange: "all",
  });

  // Fetch user's position if logged in
  useEffect(() => {
    if (currentUserId) {
      getUserLeaderboardPosition(currentUserId).then((result) => {
        if (result.success && result.position) {
          setUserPosition(result.position);
        }
      });
    }
  }, [currentUserId]);

  // Handle filter changes with server action
  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    startTransition(async () => {
      if (
        updatedFilters.timeRange === "all" &&
        !updatedFilters.mode &&
        !updatedFilters.duration
      ) {
        // Use simple getLeaderboard for "all time" without mode/duration filters
        const result = await getLeaderboard(updatedFilters.sortBy, 50);
        if (result.success && result.leaderboard) {
          setLeaderboard(result.leaderboard);
        }
      } else {
        // Use filtered leaderboard for time ranges or mode/duration
        const result = await getFilteredLeaderboard({
          mode: updatedFilters.mode,
          duration: updatedFilters.duration,
          timeRange: updatedFilters.timeRange,
          limit: 50,
        });
        if (result.success && result.leaderboard) {
          // Map filtered results to LeaderboardEntry format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = result.leaderboard.map((entry: any) => ({
            rank: entry.rank,
            userId: entry.userId,
            name: entry.name,
            image: entry.image,
            bestWpm: entry.wpm,
            avgWpm: entry.wpm, // Filtered results only have wpm
            avgAccuracy: entry.avgAccuracy,
            avgConsistency: 0, // Not available in filtered results
            totalTests: entry.testCount,
            lastActive: new Date(),
          }));
          setLeaderboard(mapped);
        }
      }
    });
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

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap gap-3 justify-center"
      >
        {/* Sort By */}
        <div className="flex gap-2 bg-card border rounded-lg p-1">
          <FilterButton
            active={filters.sortBy === "bestWpm"}
            onClick={() => handleFilterChange({ sortBy: "bestWpm" })}
            icon={<Zap className="size-4" />}
            label="Best WPM"
            disabled={isPending}
          />
          <FilterButton
            active={filters.sortBy === "avgWpm"}
            onClick={() => handleFilterChange({ sortBy: "avgWpm" })}
            icon={<TrendingUp className="size-4" />}
            label="Avg WPM"
            disabled={isPending}
          />
          <FilterButton
            active={filters.sortBy === "totalTests"}
            onClick={() => handleFilterChange({ sortBy: "totalTests" })}
            icon={<Target className="size-4" />}
            label="Tests"
            disabled={isPending}
          />
        </div>

        {/* Time Range */}
        <div className="flex gap-2 bg-card border rounded-lg p-1">
          <FilterButton
            active={filters.timeRange === "today"}
            onClick={() => handleFilterChange({ timeRange: "today" })}
            label="Today"
            disabled={isPending}
          />
          <FilterButton
            active={filters.timeRange === "week"}
            onClick={() => handleFilterChange({ timeRange: "week" })}
            label="Week"
            disabled={isPending}
          />
          <FilterButton
            active={filters.timeRange === "month"}
            onClick={() => handleFilterChange({ timeRange: "month" })}
            label="Month"
            disabled={isPending}
          />
          <FilterButton
            active={filters.timeRange === "all"}
            onClick={() => handleFilterChange({ timeRange: "all" })}
            label="All Time"
            disabled={isPending}
          />
        </div>
      </motion.div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="mb-4 text-center text-sm text-muted-foreground">
          <div className="inline-block animate-spin size-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
          Updating leaderboard...
        </div>
      )}

      {/* Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card border rounded-lg overflow-hidden"
      >
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b font-semibold text-sm text-muted-foreground">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Player</div>
          <div className="col-span-2 text-center">WPM</div>
          <div className="col-span-2 text-center">Accuracy</div>
          <div className="col-span-2 text-center">Tests</div>
          <div className="col-span-1 text-center">Badge</div>
        </div>

        {/* Empty State */}
        {leaderboard.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No entries found for selected filters
          </div>
        )}

        {/* Entries */}
        {leaderboard.map((entry, index) => (
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
            {/* Rank */}
            <div className="col-span-1 flex items-center">
              {getRankIcon(entry.rank)}
            </div>

            {/* Player */}
            <div className="col-span-4 flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                {entry.image ? (
                  <img
                    src={entry.image}
                    alt={entry.name}
                    className="size-10 rounded-full"
                  />
                ) : (
                  getInitials(entry.name)
                )}
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

            {/* WPM */}
            <div className="col-span-2 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-primary">
                {entry.bestWpm}
              </div>
              <div className="text-xs text-muted-foreground">
                avg {entry.avgWpm}
              </div>
            </div>

            {/* Accuracy */}
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

            {/* Tests */}
            <div className="col-span-2 flex items-center justify-center font-semibold">
              {entry.totalTests}
            </div>

            {/* Badge */}
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

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-center text-sm text-muted-foreground"
      >
        Showing top {leaderboard.length} players
      </motion.div>
    </>
  );
}

function FilterButton({
  active,
  onClick,
  icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
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
