"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function updateUsername(newUsername: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user.id) {
      return { success: false, error: "Not authenticated" };
    }

    const trimmedUsername = newUsername.trim();

    // 1. Validate username length/content
    if (!trimmedUsername || trimmedUsername.length < 3) {
      return {
        success: false,
        error: "Username must be at least 3 characters long",
      };
    }

    if (trimmedUsername.length > 30) {
      return {
        success: false,
        error: "Username must be less than 30 characters",
      };
    }

    // 2. CHECK IF USERNAME IS ALREADY TAKEN
    const existingUser = await prisma.user.findFirst({
      where: {
        name: {
          equals: trimmedUsername,
          mode: "insensitive", // Optional: makes 'John' and 'john' the same
        },
        NOT: {
          id: session.user.id, // Don't flag if the user is keeping their own name
        },
      },
    });

    if (existingUser) {
      return { success: false, error: "This username is already taken" };
    }

    // 3. Update username
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: trimmedUsername },
    });

    return { success: true, message: "Username updated successfully" };
  } catch (error) {
    console.error("Failed to update username:", error);
    return { success: false, error: "Failed to update username" };
  }
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Get user's email for password verification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user has a password (not social login)
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "credential",
      },
    });

    if (!account || !account.password) {
      return {
        success: false,
        error: "No password found. You may be using social login.",
      };
    }

    // Validate new password
    if (newPassword.length < 8) {
      return {
        success: false,
        error: "New password must be at least 8 characters long",
      };
    }

    // Use Better Auth's changePassword method
    try {
      await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: false, // Set to true if you want to log out other sessions
        },
        headers: await headers(),
      });

      return { success: true, message: "Password updated successfully" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (authError: any) {
      // Better Auth will throw an error if current password is wrong
      if (authError?.message?.includes("password")) {
        return { success: false, error: "Current password is incorrect" };
      }
      throw authError;
    }
  } catch (error) {
    console.error("Failed to update password:", error);
    return { success: false, error: "Failed to update password" };
  }
}

export async function getUserSettings(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user has a password (credential account)
    const hasPassword = await prisma.account.findFirst({
      where: {
        userId,
        providerId: "credential",
        password: { not: null },
      },
    });

    return {
      success: true,
      user,
      hasPassword: !!hasPassword,
    };
  } catch (error) {
    console.error("Failed to get user settings:", error);
    return { success: false, error: "Failed to fetch user settings" };
  }
}
