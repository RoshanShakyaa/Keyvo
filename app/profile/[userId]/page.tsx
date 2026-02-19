import { getServerSession } from "@/lib/get-session";
import { getUserById } from "@/app/actions/test-results";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

const ProfilePage = async ({
  params,
}: {
  params: Promise<{ userId?: string[] }>;
}) => {
  const resolvedParams = await params;
  const session = await getServerSession();

  const targetUserId =
    resolvedParams.userId?.[0] || session?.user?.id;

  if (!targetUserId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">User not found or not logged in.</p>
      </div>
    );
  }

  const userRes = await getUserById(targetUserId);

  if (!userRes.success || !userRes.user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === userRes.user.id;

  return (
    <ProfileClient
      user={userRes.user}
      isOwnProfile={isOwnProfile}
      sessionUserId={session?.user?.id}
    />
  );
};

export default ProfilePage;