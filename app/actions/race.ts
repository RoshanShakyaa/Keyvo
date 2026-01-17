"use server";

import { getRandomWords } from "@/lib/words";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/get-session";

function generateRaceCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createRace(settings: RaceSettings) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Unauthorized");

  let code = generateRaceCode();
  while (await prisma.race.findUnique({ where: { code } })) {
    code = generateRaceCode();
  }

  const wordCount = settings.mode === "WORDS" ? settings.wordCount ?? 50 : 100;

  const words = getRandomWords(wordCount, {
    punctuation: settings.punctuation,
    numbers: settings.numbers,
  });

  const race = await prisma.race.create({
    data: {
      code,
      hostId: session.user.id,
      mode: settings.mode,
      duration: settings.duration ?? 60,
      words,
      status: "LOBBY",
    },
  });

  await prisma.raceParticipant.create({
    data: {
      raceId: race.id,
      userId: session.user.id,
    },
  });

  return { code: race.code };
}

function parseWords(words: unknown): string[] {
  if (!Array.isArray(words)) return [];
  return words.filter((w): w is string => typeof w === "string");
}

export async function getRace(code: string) {
  const race = await prisma.race.findUnique({
    where: { code },
    include: {
      host: { select: { id: true, name: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!race) throw new Error("Race not found");

  return {
    id: race.id,
    code: race.code,
    hostId: race.hostId,
    host: race.host,
    participants: race.participants,
    mode: race.mode,
    duration: race.duration,
    status: race.status,
    words: parseWords(race.words), // ✅ string[]
  };
}

export async function joinRace(code: string) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Unauthorized");

  const race = await prisma.race.findUnique({
    where: { code },
    include: { participants: true },
  });

  if (!race) throw new Error("Race not found");
  if (race.status !== "LOBBY") throw new Error("Race already started");
  if (race.participants.length >= race.maxPlayers)
    throw new Error("Race is full");

  const alreadyJoined = race.participants.some(
    (p) => p.userId === session.user.id
  );

  if (!alreadyJoined) {
    await prisma.raceParticipant.create({
      data: {
        raceId: race.id,
        userId: session.user.id,
      },
    });
  }

  return { raceId: race.id };
}

export type RaceSettings = {
  mode: "TIME" | "WORDS";
  duration?: number;
  wordCount?: number;
  punctuation: boolean;
  numbers: boolean;
};
