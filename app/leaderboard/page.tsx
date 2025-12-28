import { Suspense } from "react";
import { getLeaderboard } from "@/app/actions/leaderboard";
import LeaderboardClient from "@/components/LeaderboardClient";
import { Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function LeaderboardPage() {
  // Get current user's position if logged in
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Trophy className="size-10 text-primary" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Top typists from around the world
          </p>
        </div>

        {/* Client Component with Suspense */}
        <Suspense fallback={<LeaderboardSkeleton />}>
          <LeaderboardContent userId={session?.user?.id} />
        </Suspense>
      </div>
    </div>
  );
}

// Server Component that fetches initial data
async function LeaderboardContent({ userId }: { userId?: string }) {
  const result = await getLeaderboard("bestWpm", 50);

  if (!result.success || !result.leaderboard) {
    return (
      <div className="text-center text-muted-foreground p-12">
        Failed to load leaderboard
      </div>
    );
  }

  return (
    <LeaderboardClient
      initialData={result.leaderboard}
      currentUserId={userId}
    />
  );
}

// Loading skeleton
function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter skeleton */}
      <div className="flex gap-3 justify-center">
        <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="bg-card border rounded-lg p-8">
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="size-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-1/6" />
              </div>
              <div className="h-6 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
