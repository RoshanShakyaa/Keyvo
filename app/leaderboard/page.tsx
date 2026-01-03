import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LeaderboardClient from "@/components/LeaderboardClient";
import { Trophy } from "lucide-react";

export default async function LeaderboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Trophy className="size-10 text-primary" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Top typists from around the world
          </p>
        </div>

        <LeaderboardClient currentUserId={session?.user?.id} />
      </div>
    </div>
  );
}
