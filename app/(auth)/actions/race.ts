// app/actions/race.ts
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getRandomWords } from "@/lib/words";
import { prisma } from "@/lib/prisma";

// Generate a unique race code
function generateRaceCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createRace(options?: {
  mode?: "time" | "words";
  duration?: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Generate race code
  let code = generateRaceCode();

  // Ensure code is unique
  let existing = await prisma.race.findUnique({ where: { code } });
  while (existing) {
    code = generateRaceCode();
    existing = await prisma.race.findUnique({ where: { code } });
  }

  // Generate words for the race
  const words = getRandomWords(100, { punctuation: false, numbers: false });

  const race = await prisma.race.create({
    data: {
      code,
      hostId: session.user.id,
      mode: options?.mode || "time",
      duration: options?.duration || 60,
      words: words,
      status: "WAITING",
    },
  });

  // Add host as participant
  await prisma.raceParticipant.create({
    data: {
      raceId: race.id,
      userId: session.user.id,
    },
  });

  return { code, raceId: race.id };
}

export async function joinRace(code: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const race = await prisma.race.findUnique({
    where: { code },
    include: {
      participants: true,
    },
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

  // Check if already joined
  const existing = race.participants.find((p) => p.userId === session.user.id);
  if (existing) {
    return { raceId: race.id, race };
  }

  // Add participant
  await prisma.raceParticipant.create({
    data: {
      raceId: race.id,
      userId: session.user.id,
    },
  });

  return { raceId: race.id, race };
}

export async function getRace(code: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const race = await prisma.race.findUnique({
    where: { code },
    include: {
      host: {
        select: {
          id: true,
          name: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!race) {
    throw new Error("Race not found");
  }

  return race;
}

export async function saveRaceResult(data: {
  raceId: string;
  wpm: number;
  accuracy: number;
  position: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await prisma.raceParticipant.updateMany({
    where: {
      raceId: data.raceId,
      userId: session.user.id,
    },
    data: {
      wpm: data.wpm,
      accuracy: data.accuracy,
      position: data.position,
      finished: true,
      finishedAt: new Date(),
    },
  });
}
