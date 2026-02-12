"use client";

import React, { useState, useEffect, useTransition } from "react";
import { User, Lock, Mail, Calendar } from "lucide-react";
import {
  updateUsername,
  updatePassword,
  getUserSettings,
} from "../actions/user-settings";
import { authClient } from "@/lib/auth-client";

const SettingsPage = () => {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [isLoading, setIsLoading] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);

  // Username form state
  const [username, setUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load user settings when component mounts or user changes
  useEffect(() => {
    let isMounted = true;

    const loadUserSettings = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      const result = await getUserSettings(user.id);

      if (isMounted) {
        if (result.success) {
          setUsername(result.user?.name || "");
          setHasPassword(result.hasPassword || false);
        }
        setIsLoading(false);
      }
    };

    loadUserSettings();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameMessage(null);
    setUsernameLoading(true);

    const result = await updateUsername(username);

    if (result.success) {
      setUsernameMessage({
        type: "success",
        text: result.message || "Success",
      });
    } else {
      setUsernameMessage({ type: "error", text: result.error || "Failed" });
    }

    setUsernameLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New passwords do not match",
      });
      return;
    }

    setPasswordLoading(true);

    const result = await updatePassword(currentPassword, newPassword);

    if (result.success) {
      setPasswordMessage({
        type: "success",
        text: result.message || "Success",
      });
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMessage({ type: "error", text: result.error || "Failed" });
    }

    setPasswordLoading(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Please log in to view settings</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 pt-12 w-4xl mx-auto px-4 pb-12 text-foreground">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Info Card */}
      <div className="w-full rounded-lg border bg-card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <User className="size-5" />
          Account Information
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Mail className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Calendar className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Update Username */}
      <div className="w-full rounded-lg border bg-card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <User className="size-5" />
          Update Username
        </h2>
        <form onSubmit={handleUsernameSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter new username"
              minLength={3}
              maxLength={30}
              required
            />
          </div>

          {usernameMessage && (
            <div
              className={`p-3 rounded-lg text-sm ${
                usernameMessage.type === "success"
                  ? "bg-green-500/10 text-green-500 border border-green-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {usernameMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={usernameLoading || username === user.name}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {usernameLoading ? "Updating..." : "Update Username"}
          </button>
        </form>
      </div>

      {/* Update Password */}
      {hasPassword && (
        <div className="w-full rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="size-5" />
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium mb-2"
              >
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium mb-2"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter new password"
                minLength={8}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                At least 8 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Confirm new password"
                minLength={8}
                required
              />
            </div>

            {passwordMessage && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  passwordMessage.type === "success"
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {passwordLoading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      )}

      {!hasPassword && (
        <div className="w-full rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="size-5" />
            Password
          </h2>
          <p className="text-muted-foreground">
            You are using social login. Password changes are not available for
            social accounts.
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
