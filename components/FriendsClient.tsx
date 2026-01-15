"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Users,
  UserPlus,
  Search,
  X,
  Check,
  Swords,
  UsersRound,
  Clock,
} from "lucide-react";

import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  searchUsers,
  type SearchUser,
} from "@/app/actions/friendship";
import {
  createFriendsQueryOptions,
  createPendingRequestsQueryOptions,
  createSentRequestsQueryOptions,
} from "@/hooks/useQueryOptions";
import { CreateRaceButton } from "./CreateRaceButton";
import { JoinRaceButton } from "./JoinRaceButton";

export default function FriendsClient() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">(
    "friends"
  );

  // Queries
  const { data: friendsData } = useQuery(createFriendsQueryOptions());
  const { data: pendingData } = useQuery(createPendingRequestsQueryOptions());
  const { data: sentData } = useQuery(createSentRequestsQueryOptions());

  const friends = friendsData?.friends ?? [];
  const pendingRequests = pendingData?.requests ?? [];
  const sentRequests = sentData?.requests ?? [];

  /* ---------- ACTIONS ---------- */

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;

    startTransition(async () => {
      const result = await searchUsers(searchQuery);
      if (result.success) {
        setSearchResults(result.users ?? []);
      }
    });
  };

  const handleSendRequest = async (userId: string) => {
    startTransition(async () => {
      const result = await sendFriendRequest(userId);
      if (result.success) {
        // Refresh search and sent requests
        await handleSearch();
        queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
      }
    });
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    startTransition(async () => {
      const result = await acceptFriendRequest(friendshipId);
      if (result.success) {
        // Refresh friends and pending requests
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      }
    });
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    startTransition(async () => {
      const result = await declineFriendRequest(friendshipId);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      }
    });
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;

    startTransition(async () => {
      const result = await removeFriend(friendshipId);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["friends"] });
      }
    });
  };

  /* ---------- HELPERS ---------- */

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  /* ---------- UI ---------- */

  return (
    <div className="space-y-6">
      <CreateRaceButton />
      <JoinRaceButton />
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <TabButton
          active={activeTab === "friends"}
          onClick={() => setActiveTab("friends")}
          icon={<Users className="size-4" />}
          label="Friends"
          count={friends.length}
        />
        <TabButton
          active={activeTab === "requests"}
          onClick={() => setActiveTab("requests")}
          icon={<UserPlus className="size-4" />}
          label="Requests"
          count={pendingRequests.length}
        />
        <TabButton
          active={activeTab === "search"}
          onClick={() => setActiveTab("search")}
          icon={<Search className="size-4" />}
          label="Find Friends"
        />
      </div>

      {/* Friends Tab */}
      {activeTab === "friends" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Your Friends ({friends.length})
            </h2>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <UsersRound className="size-4" />
              Create Race Lobby
            </button>
          </div>

          {friends.length === 0 ? (
            <div className="bg-card border rounded-lg p-12 text-center">
              <Users className="size-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No friends yet</p>
              <button
                onClick={() => setActiveTab("search")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Find Friends
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.friendshipId}
                  className="bg-card border rounded-lg p-4 flex justify-between items-center hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                      {getInitials(friend.name)}
                    </div>
                    <div>
                      <div className="font-semibold">{friend.name}</div>
                      {friend.stats && (
                        <div className="text-sm text-muted-foreground">
                          Best: {friend.stats.bestWpm} WPM •{" "}
                          {friend.stats.totalTests} tests
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Friends since{" "}
                        {new Date(friend.friendsSince).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 flex items-center gap-2">
                      <Swords className="size-4" />
                      Race
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.friendshipId)}
                      disabled={isPending}
                      className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Pending Requests (Received) */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Pending Requests ({pendingRequests.length})
            </h2>

            {pendingRequests.length === 0 ? (
              <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
                No pending requests
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.friendshipId}
                    className="bg-card border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                        {getInitials(req.name)}
                      </div>
                      <div>
                        <div className="font-semibold">{req.name}</div>
                        {req.stats && (
                          <div className="text-sm text-muted-foreground">
                            Best: {req.stats.bestWpm} WPM
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          <Clock className="inline size-3 mr-1" />
                          {new Date(req.requestedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(req.friendshipId)}
                        disabled={isPending}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex gap-2 disabled:opacity-50"
                      >
                        <Check className="size-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(req.friendshipId)}
                        disabled={isPending}
                        className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-50"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Sent Requests ({sentRequests.length})
            </h2>

            {sentRequests.length === 0 ? (
              <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
                No sent requests
              </div>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((req) => (
                  <div
                    key={req.friendshipId}
                    className="bg-card border rounded-lg p-4 flex items-center gap-4 opacity-70"
                  >
                    <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                      {getInitials(req.name)}
                    </div>
                    <div>
                      <div className="font-semibold">{req.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Request pending...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sent {new Date(req.requestedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Search Tab */}
      {activeTab === "search" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isPending || searchQuery.trim().length < 2}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              Search
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((user) => (
                <div
                  key={user.userId}
                  className="bg-card border rounded-lg p-4 flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      {user.stats && (
                        <div className="text-sm text-muted-foreground">
                          Best: {user.stats.bestWpm} WPM • Avg:{" "}
                          {user.stats.avgWpm} WPM
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {user.friendshipStatus === "ACCEPTED" && (
                      <span className="px-4 py-2 bg-primary/10 text-primary rounded-lg flex items-center gap-2">
                        <Check className="size-4" />
                        Friends
                      </span>
                    )}
                    {user.friendshipStatus === "PENDING" && (
                      <span className="px-4 py-2 bg-muted text-muted-foreground rounded-lg">
                        Pending
                      </span>
                    )}
                    {!user.friendshipStatus && (
                      <button
                        onClick={() => handleSendRequest(user.userId)}
                        disabled={isPending}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                      >
                        <UserPlus className="size-4" />
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
              {searchQuery.trim().length >= 2
                ? "No users found"
                : "Enter a name or email to search"}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ---------------------------------- */

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
        active
          ? "border-primary text-primary font-semibold"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}
