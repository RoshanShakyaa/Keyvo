"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function sendFriendRequest(addresseeId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const requesterId = session.user.id;

    // Can't send to yourself
    if (requesterId === addresseeId) {
      return { success: false, error: "Cannot send request to yourself" };
    }

    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      return { success: false, error: "Friendship request already exists" };
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: "PENDING",
      },
    });

    return { success: true, friendship };
  } catch (error) {
    console.error("Failed to send friend request:", error);
    return { success: false, error: "Failed to send request" };
  }
}

export async function acceptFriendRequest(friendshipId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Update friendship status
    const friendship = await prisma.friendship.update({
      where: {
        id: friendshipId,
        addresseeId: userId, // Only addressee can accept
      },
      data: {
        status: "ACCEPTED",
      },
    });

    return { success: true, friendship };
  } catch (error) {
    console.error("Failed to accept friend request:", error);
    return { success: false, error: "Failed to accept request" };
  }
}

export async function declineFriendRequest(friendshipId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    await prisma.friendship.update({
      where: {
        id: friendshipId,
        addresseeId: userId,
      },
      data: {
        status: "DECLINED",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to decline friend request:", error);
    return { success: false, error: "Failed to decline request" };
  }
}

export async function removeFriend(friendshipId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Delete friendship where user is either requester or addressee
    await prisma.friendship.delete({
      where: {
        id: friendshipId,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to remove friend:", error);
    return { success: false, error: "Failed to remove friend" };
  }
}

export async function getFriends(userId?: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return { success: false, error: "User not found" };
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: targetUserId, status: "ACCEPTED" },
          { addresseeId: targetUserId, status: "ACCEPTED" },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            image: true,
            stats: true,
          },
        },
        addressee: {
          select: {
            id: true,
            name: true,
            image: true,
            stats: true,
          },
        },
      },
    });

    // Map to friend list (get the other user)
    const friends = friendships.map((friendship) => {
      const friend =
        friendship.requesterId === targetUserId
          ? friendship.addressee
          : friendship.requester;

      return {
        friendshipId: friendship.id,
        userId: friend.id,
        name: friend.name || "Anonymous",
        image: friend.image,
        stats: friend.stats?.[0] || null,
        friendsSince: friendship.createdAt,
      };
    });

    return { success: true, friends };
  } catch (error) {
    console.error("Failed to get friends:", error);
    return { success: false, error: "Failed to fetch friends" };
  }
}

export async function getPendingRequests() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    const requests = await prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: "PENDING",
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            image: true,
            stats: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const pending = requests.map((request) => ({
      friendshipId: request.id,
      userId: request.requester.id,
      name: request.requester.name || "Anonymous",
      image: request.requester.image,
      stats: request.requester.stats?.[0] || null,
      requestedAt: request.createdAt,
    }));

    return { success: true, requests: pending };
  } catch (error) {
    console.error("Failed to get pending requests:", error);
    return { success: false, error: "Failed to fetch requests" };
  }
}

export async function getSentRequests() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    const requests = await prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: "PENDING",
      },
      include: {
        addressee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const sent = requests.map((request) => ({
      friendshipId: request.id,
      userId: request.addressee.id,
      name: request.addressee.name || "Anonymous",
      image: request.addressee.image,
      requestedAt: request.createdAt,
    }));

    return { success: true, requests: sent };
  } catch (error) {
    console.error("Failed to get sent requests:", error);
    return { success: false, error: "Failed to fetch requests" };
  }
}

export async function searchUsers(query: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const currentUserId = session.user.id;

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        stats: {
          select: {
            bestWpm: true,
            avgWpm: true,
            totalTests: true,
          },
        },
      },
      take: 10,
    });

    // Check friendship status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { requesterId: currentUserId, addresseeId: user.id },
              { requesterId: user.id, addresseeId: currentUserId },
            ],
          },
        });

        return {
          userId: user.id,
          name: user.name || "Anonymous",
          email: user.email,
          image: user.image,
          stats: user.stats?.[0] || null,
          friendshipStatus: friendship?.status || null,
          friendshipId: friendship?.id || null,
        };
      }),
    );

    return { success: true, users: usersWithStatus };
  } catch (error) {
    console.error("Failed to search users:", error);
    return { success: false, error: "Failed to search users" };
  }
}

export type Friend = NonNullable<
  Awaited<ReturnType<typeof getFriends>>["friends"]
>[number];
export type PendingRequest = NonNullable<
  Awaited<ReturnType<typeof getPendingRequests>>["requests"]
>[number];
export type SentRequest = NonNullable<
  Awaited<ReturnType<typeof getSentRequests>>["requests"]
>[number];
export type SearchUser = NonNullable<
  Awaited<ReturnType<typeof searchUsers>>["users"]
>[number];
