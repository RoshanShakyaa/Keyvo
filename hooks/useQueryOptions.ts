import {
  getFriends,
  getPendingRequests,
  getSentRequests,
} from "@/app/actions/friendship";
import { getRaceStats, getRecentRaces, getRecentTests, getUserStats } from "@/app/actions/test-results";
import { queryOptions } from "@tanstack/react-query";

export function createFriendsQueryOptions() {
  return queryOptions({
    queryKey: ["friends"],
    queryFn: () => getFriends(),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}
export function createPendingRequestsQueryOptions() {
  return queryOptions({
    queryKey: ["pendingRequests"],
    queryFn: () => getPendingRequests(),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}
export function createSentRequestsQueryOptions() {
  return queryOptions({
    queryKey: ["sentRequests"],
    queryFn: () => getSentRequests(),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}


// In your query-options file — add these alongside the existing ones

export function getUserStatsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["userStats", id],
    queryFn: () => getUserStats(id),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function getRecentTestsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["recentTests", id],
    queryFn: () => getRecentTests(id, 5),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function getRecentRacesQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["recentRaces", id],
    queryFn: () => getRecentRaces(id, 5),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function getRaceStatsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["raceStats", id],
    queryFn: () => getRaceStats(id),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}