    "use client";

import React, { useState } from "react";
import { User, Lock, Mail, Calendar } from "lucide-react";
import { updateUsername, updatePassword } from "../actions/user-settings";

interface SettingsFormProps {
  user: any;
  initialHasPassword: boolean;
}

const SettingsForm = ({ user, initialHasPassword }: SettingsFormProps) => {
  const [hasPassword] = useState(initialHasPassword);
  const [username, setUsername] = useState(user.name || "");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameMessage(null);
    setUsernameLoading(true);
    const result = await updateUsername(username);
    setUsernameMessage(result.success 
        ? { type: "success", text: result.message || "Success" }
        : { type: "error", text: result.error || "Failed" }
    );
    setUsernameLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    setPasswordLoading(true);
    const result = await updatePassword(currentPassword, newPassword);
    if (result.success) {
      setPasswordMessage({ type: "success", text: result.message || "Success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMessage({ type: "error", text: result.error || "Failed" });
    }
    setPasswordLoading(false);
  };

  return (
    <>
      {/* Account Info Card */}
      <div className="w-full rounded-lg border bg-card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <User className="size-5" /> Account Information
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
          <User className="size-5" /> Update Username
        </h2>
        <form onSubmit={handleUsernameSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border bg-background"
            placeholder="Enter new username"
            required
          />
          {usernameMessage && (
            <div className={`p-3 rounded-lg text-sm ${usernameMessage.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
              {usernameMessage.text}
            </div>
          )}
          <button
            type="submit"
            disabled={usernameLoading || username === user.name}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
          >
            {usernameLoading ? "Updating..." : "Update Username"}
          </button>
        </form>
      </div>

      {/* Update Password */}
      {hasPassword ? (
        <div className="w-full rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="size-5" /> Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-background"
              required
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-background"
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-background"
              required
            />
            {passwordMessage && (
              <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                {passwordMessage.text}
              </div>
            )}
            <button type="submit" disabled={passwordLoading} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg">
              {passwordLoading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full rounded-lg border bg-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="size-5" /> Password
          </h2>
          <p className="text-muted-foreground">You are using social login.</p>
        </div>
      )}
    </>
  );
};

export default SettingsForm;