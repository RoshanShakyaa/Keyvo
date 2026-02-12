"use server";

import { getRandomWords } from "@/lib/words";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/get-session";
import { RaceDTO } from "@/lib/types";
import { RaceSettings } from "../../lib/types";

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

  const duration = settings.duration;
  let wordCount = Math.ceil((duration / 60) * 40);
  wordCount = Math.ceil(wordCount * 1.5);

  const words = getRandomWords(wordCount, {
    punctuation: settings.punctuation,
    numbers: settings.numbers,
  });

  const race = await prisma.race.create({
    data: {
      code,
      hostId: session.user.id,
      duration,
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

export async function getRace(code: string): Promise<RaceDTO> {
  const race = await prisma.race.findUnique({
    where: { code },
    include: {
      host: { select: { id: true, name: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: [
          { finished: "desc" }, // Finished players first
          { position: "asc" }, // Then by position (1st, 2nd, 3rd...)
          { wpm: "desc" }, // Then by WPM for unfinished players
        ],
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
    duration: race.duration,
    status: race.status,
    words: parseWords(race.words),
    startTime: race.startTime?.toISOString(),
    endTime: race.endTime?.toISOString(),
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
    (p) => p.userId === session.user.id,
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

export async function startRace(code: string) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Unauthorized");

  const race = await prisma.race.findUnique({
    where: { code },
  });

  if (!race) throw new Error("Race not found");
  if (race.hostId !== session.user.id)
    throw new Error("Only host can start race");
  if (race.status !== "LOBBY") throw new Error("Race already started");

  await prisma.race.update({
    where: { code },
    data: {
      status: "RACING",
      startTime: new Date(),
    },
  });

  return { success: true };
}

export async function finishRace(
  code: string,
  stats: {
    progress: number;
    wpm: number;
    accuracy: number;
  },
) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Unauthorized");

  const race = await prisma.race.findUnique({
    where: { code },
    include: {
      participants: {
        where: { finished: true },
        orderBy: [
          { finishedAt: "asc" }, // Earlier finishers first
          { wpm: "desc" }, // Then by WPM for same-time finishes
        ],
      },
    },
  });

  if (!race) throw new Error("Race not found");

  // Calculate position: number of players who finished before + 1
  const position = race.participants.length + 1;

  await prisma.raceParticipant.upsert({
    where: {
      raceId_userId: {
        raceId: race.id,
        userId: session.user.id,
      },
    },
    update: {
      progress: stats.progress,
      wpm: Math.round(stats.wpm),
      accuracy: Math.round(stats.accuracy),
      position: position,
      finished: true,
      finishedAt: new Date(),
    },
    create: {
      raceId: race.id,
      userId: session.user.id,
      progress: stats.progress,
      wpm: Math.round(stats.wpm),
      accuracy: Math.round(stats.accuracy),
      position: position,
      finished: true,
      finishedAt: new Date(),
    },
  });

  return { success: true, position };
}

export async function endRace(code: string) {
  const session = await getServerSession();
  if (!session?.user) throw new Error("Unauthorized");

  const race = await prisma.race.findUnique({
    where: { code },
  });

  if (!race) throw new Error("Race not found");
  if (race.hostId !== session.user.id)
    throw new Error("Only host can end race");

  await prisma.race.update({
    where: { code },
    data: {
      status: "FINISHED",
      endTime: new Date(),
    },
  });

  return { success: true };
}
