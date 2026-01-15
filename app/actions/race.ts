"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getRandomWords } from "@/lib/words";
import { prisma } from "@/lib/prisma";

// WHY: Generate unique codes to identify races
function generateRaceCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// WHY: Create race in DATABASE so everyone types the same words
export async function createRace() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  let code = generateRaceCode();
  let existing = await prisma.race.findUnique({ where: { code } });
  while (existing) {
    code = generateRaceCode();
    existing = await prisma.race.findUnique({ where: { code } });
  }

  // WHY: Generate words server-side so all players get EXACT same text
  const words: string[] = getRandomWords(100, {
    punctuation: false,
    numbers: false,
  });

  const race = await prisma.race.create({
    data: {
      code,
      hostId: session.user.id,
      mode: "time",
      duration: 60,
      words: words,
      status: "WAITING",
    },
  });

  await prisma.raceParticipant.create({
    data: {
      raceId: race.id,
      userId: session.user.id,
    },
  });

  return { code, raceId: race.id };
}

function parseWords(words: unknown): string[] {
  if (!Array.isArray(words)) return [];
  return words.filter((w) => typeof w === "string");
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

  if (!race) {
    throw new Error("Race not found");
  }

  return {
    id: race.id,
    code: race.code,
    hostId: race.hostId,
    host: race.host,
    participants: race.participants,
    mode: race.mode,
    duration: race.duration,
    status: race.status,
    words: parseWords(race.words),
  };
}

// WHY: Allow others to join via code
export async function joinRace(code: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const race = await prisma.race.findUnique({
    where: { code },
    include: { participants: true },
  });

  if (!race) {
    throw new Error("Race not found");
  }

  if (race.status !== "WAITING") {
    throw new Error("Race has already started");
  }

  if (race.participants.length >= race.maxPlayers) {
    throw new Error("Race is full");
  }

  const existing = race.participants.find((p) => p.userId === session.user.id);
  if (existing) {
    return { raceId: race.id, race };
  }

  await prisma.raceParticipant.create({
    data: {
      raceId: race.id,
      userId: session.user.id,
    },
  });

  return { raceId: race.id, race };
}
