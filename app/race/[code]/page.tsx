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

  if (!session?.user) redirect("/login");

  let race: RaceDTO | null;
  try {
    race = await getRace(code);
  } catch {
    race = null;
  }

  if (!race) {
    return <div>Race not found</div>;
  }

  return (
    <RaceCore
      duration={race.duration}
      words={race.words}
      raceCode={race.code}
      isHost={race.hostId === session.user.id}
      userId={session.user.id}
      userName={session.user.name || "Anonymous"}
    />
  );
}
