// app/race/[code]/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RaceDTO } from "@/lib/types";
import { getRace } from "@/app/actions/race";
import { RaceCore } from "./RaceLobby";

export default async function RacePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  let race: RaceDTO | null;
  try {
    race = await getRace(code);
  } catch (e) {
    race = null;
  }

  if (!race) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Race Not Found</h1>
        <p className="text-gray-400">
          This race doesn&apos;t exist or has already been completed.
        </p>
      </div>
    );
  }

  const isHost = race.hostId === session.user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <RaceCore
        duration={race.duration}
        words={race.words}
        raceCode={race.code}
        isHost={isHost}
        userId={session.user.id}
        userName={session.user.name || "Anonymous"}
      />
    </div>
  );
}
