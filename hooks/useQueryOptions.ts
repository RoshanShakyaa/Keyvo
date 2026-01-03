import {
  getFriends,
  getPendingRequests,
  getSentRequests,
} from "@/app/actions/friendship";
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
