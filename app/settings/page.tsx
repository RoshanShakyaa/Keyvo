import { auth } from "@/lib/auth"; // Your server-side auth check
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSettings } from "../actions/user-settings";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const result = await getUserSettings(session.user.id);

  return (
    <div className="flex-1 pt-12 w-4xl mx-auto px-4 pb-12 text-foreground">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <SettingsForm
        user={session.user} 
        initialHasPassword={result.hasPassword || false} 
      />
    </div>
  );
}