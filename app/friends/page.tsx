import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
} from "@/app/actions/friendship";
import FriendsClient from "@/components/FriendsClient";
import { Users } from "lucide-react";

export default async function FriendsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Users className="size-10 text-primary" />
            Friends
          </h1>
          <p className="text-muted-foreground">
            Connect with friends and race together
          </p>
        </div>

        <Suspense fallback={<FriendsLoading />}>
          <FriendsContent />
        </Suspense>
      </div>
    </div>
  );
}

async function FriendsContent() {
  const [friendsResult, pendingResult, sentResult] = await Promise.all([
    getFriends(),
    getPendingRequests(),
    getSentRequests(),
  ]);

  return (
    <FriendsClient
      initialFriends={
        friendsResult.success && friendsResult.friends
          ? friendsResult.friends
          : []
      }
      initialPendingRequests={
        pendingResult.success && pendingResult.requests
          ? pendingResult.requests
          : []
      }
      initialSentRequests={
        sentResult.success && sentResult.requests ? sentResult.requests : []
      }
    />
  );
}

function FriendsLoading() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center gap-4">
                <div className="size-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
