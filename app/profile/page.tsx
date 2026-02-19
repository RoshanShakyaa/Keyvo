import { getServerSession } from "@/lib/get-session";
import { ProfileClient } from "./profile-client";

const ProfilePage = async () => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Please log in to view stats</p>
      </div>
    );
  }

  return <ProfileClient user={user} />;
};

export default ProfilePage;