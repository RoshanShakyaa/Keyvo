"use client";

import { useEffect, useRef, useState } from "react";
import * as Ably from "ably";
import type { PresenceMessage } from "ably";
import { useTestEngine } from "@/hooks/useTestEngine";
import { RaceCoreProps, RACER_COLORS } from "@/lib/types";
import { finishRace, endRace, startRace, createRace } from "@/app/actions/race";

import { TypingArea } from "./_components/TypingArea";
import { LobbyView } from "./_components/LobbyVIew";
import { ResultsView } from "./_components/ResultView";
import { RaceHeader } from "./_components/RaceHeader";

type ParticipantResult = {
  clientId: string;
  name: string;
  wpm: number;
  accuracy: number;
};

export function RaceCore({
  raceCode,
  words,
  isHost,
  userId,
  userName,
  duration,
  settings = { punctuation: false, numbers: false },
}: RaceCoreProps) {
  // --- 1. State ---
  const [presenceSet, setPresenceSet] = useState<PresenceMessage[]>([]);
  const [status, setStatus] = useState<
    "LOBBY" | "COUNTDOWN" | "RACING" | "FINISHED"
  >("LOBBY");
  const [countdown, setCountdown] = useState(3);
  const [otherProgress, setOtherProgress] = useState<
    Record<string, { caret: number; wpm: number }>
  >({});
  const [finalResults, setFinalResults] = useState<ParticipantResult[]>([]);
  const [rematchVotes, setRematchVotes] = useState<Set<string>>(new Set());
  const [rematchInProgress, setRematchInProgress] = useState(false);

  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const hasFinishedRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timerRef = useRef<any>(null);
  const isCleaningUpRef = useRef(false);
  const hasStartedRaceRef = useRef(false); // Prevent multiple startRace calls

  const { text, typing, timer, results } = useTestEngine(
    words,
    duration,
    "time",
  );

  // --- 2. Calculate WPM and Accuracy ---
  const calculateWpm = (charsCount: number, elapsedSeconds: number) => {
    if (elapsedSeconds < 0.5 || charsCount === 0) return 0;
    return Math.round(charsCount / 5 / (elapsedSeconds / 60));
  };

  const elapsedSeconds = duration - timer.timeLeft;
  const myWpm = calculateWpm(typing.correctChars, elapsedSeconds);

  const accuracy =
    typing.typedChars.length > 0
      ? Math.round((typing.correctChars / typing.typedChars.length) * 100)
      : 0;

  // --- 3. Ably Realtime Logic ---
  useEffect(() => {
    isCleaningUpRef.current = false;
    hasStartedRaceRef.current = false;

    const client = new Ably.Realtime({
      authUrl: "/api/ably/token",
      clientId: userId,
    });
    const channel = client.channels.get(`race:${raceCode}`);
    channelRef.current = channel;

    const syncPresence = async () => {
      if (isCleaningUpRef.current) return;
      try {
        const members = await channel.presence.get();
        console.log("Presence updated:", members.length, "members");
        setPresenceSet(members);
      } catch (err) {
        console.error("Error syncing presence:", err);
      }
    };

    // Initial presence sync
    channel.presence.enter({ name: userName }).then(() => {
      syncPresence();
    });

    // Subscribe to presence changes
    channel.presence.subscribe(["enter", "leave", "update"], () => {
      syncPresence();
    });

    // Listeners
    channel.subscribe("race:start", () => {
      if (isCleaningUpRef.current) return;
      setStatus("COUNTDOWN");
      let count = 3;
      timerRef.current = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(timerRef.current);
          setStatus("RACING");
          timer.start();

          // Only call startRace once from the host
          if (isHost && !hasStartedRaceRef.current) {
            hasStartedRaceRef.current = true;
            startRace(raceCode).catch((err) => {
              console.error("Failed to start race:", err);
              // Don't throw - race can continue even if DB update fails
            });
          }
        }
      }, 1000);
    });

    channel.subscribe("player:progress", (msg) => {
      if (isCleaningUpRef.current || msg.clientId === userId) return;
      setOtherProgress((prev) => ({ ...prev, [msg.clientId!]: msg.data }));
    });

    channel.subscribe("player:finished", (msg) => {
      if (isCleaningUpRef.current) return;
      setFinalResults((prev) => {
        const exists = prev.find((r) => r.clientId === msg.clientId);
        if (exists) return prev;
        return [...prev, { ...msg.data, clientId: msg.clientId }];
      });
    });

    channel.subscribe("race:ended", () => {
      if (isCleaningUpRef.current) return;
      setStatus("FINISHED");
    });

    channel.subscribe("rematch:vote", (msg) => {
      if (isCleaningUpRef.current) return;
      setRematchVotes((prev) => new Set(prev).add(msg.clientId!));
    });

    channel.subscribe("rematch:created", (msg) => {
      if (isCleaningUpRef.current) return;
      window.location.href = `/race/${msg.data.newRaceCode}`;
    });

    return () => {
      isCleaningUpRef.current = true;
      hasStartedRaceRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      channel.presence.leave().catch(() => {});
      channel.unsubscribe();
    };
  }, [raceCode, userId, userName]);

  // --- 4. Side Effects (Progress & Finish) ---
  useEffect(() => {
    if (status !== "RACING" || !channelRef.current) return;
    const interval = setInterval(() => {
      if (isCleaningUpRef.current) return;
      channelRef.current?.publish("player:progress", {
        caret: typing.caret,
        wpm: myWpm,
      });
    }, 200);
    return () => clearInterval(interval);
  }, [status, typing.caret, myWpm]);

  useEffect(() => {
    if (results && status === "RACING" && !hasFinishedRef.current) {
      hasFinishedRef.current = true;

      // Use results from useTestEngine for accurate WPM
      const finalWpm = results.wpm;
      const finalAccuracy = results.accuracy;

      const data = { name: userName, wpm: finalWpm, accuracy: finalAccuracy };

      // Save to database
      finishRace(raceCode, { progress: typing.caret, ...data }).catch((err) => {
        console.error("Failed to save finish:", err);
      });

      // Notify other players
      if (channelRef.current && !isCleaningUpRef.current) {
        channelRef.current.publish("player:finished", data);
      }

      // If host, end the race after a short delay to allow others to finish
      if (isHost) {
        setTimeout(() => {
          if (isCleaningUpRef.current) return;
          endRace(raceCode).catch((err) => {
            console.error("Failed to end race:", err);
          });
          channelRef.current?.publish("race:ended", {});
        }, 2000);
      }

      setStatus("FINISHED");
    }
  }, [results, status, raceCode, userName, typing.caret, isHost]);

  // --- 5. Helper for Colors ---
  const getPlayerColor = (id: string) => {
    const idx = presenceSet.findIndex((p) => p.clientId === id);
    return RACER_COLORS[idx % RACER_COLORS.length] || "#fff";
  };

  // --- 6. View Dispatcher ---
  if (status === "LOBBY") {
    return (
      <LobbyView
        raceCode={raceCode}
        duration={duration}
        wordCount={words.length}
        presenceSet={presenceSet}
        isHost={isHost}
        userId={userId}
        onStart={() => channelRef.current?.publish("race:start", {})}
      />
    );
  }

  if (status === "COUNTDOWN") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-9xl font-black text-primary animate-pulse">
          {countdown}
        </div>
      </div>
    );
  }

  if (status === "FINISHED") {
    // Combine all results without duplicates
    const allResults = [...finalResults];

    // Only add current user if not already in the list
    // Use final results from useTestEngine
    if (!allResults.find((r) => r.clientId === userId) && results) {
      allResults.push({
        clientId: userId,
        name: userName,
        wpm: results.wpm,
        accuracy: results.accuracy,
      });
    }

    return (
      <ResultsView
        results={allResults}
        userId={userId}
        isHost={isHost}
        rematchVotes={rematchVotes.size}
        totalPlayers={presenceSet.length}
        hasVoted={rematchVotes.has(userId)}
        onVoteRematch={() => {
          if (channelRef.current && !isCleaningUpRef.current) {
            channelRef.current.publish("rematch:vote", {});
            setRematchVotes((prev) => new Set(prev).add(userId));
          }
        }}
        onCreateRematch={async () => {
          setRematchInProgress(true);
          const { code } = await createRace({ duration, ...settings });
          if (channelRef.current && !isCleaningUpRef.current) {
            channelRef.current.publish("rematch:created", {
              newRaceCode: code,
            });
          }
        }}
        isCreatingRematch={rematchInProgress}
      />
    );
  }

  // RACING state
  return (
    <div className="w-full flex flex-col flex-1 max-w-4xl mx-auto pt-10 px-4">
      <RaceHeader
        timeLeft={timer.timeLeft}
        players={presenceSet}
        localWpm={myWpm}
        userId={userId}
        otherProgress={otherProgress}
        getPlayerColor={getPlayerColor}
      />

      <TypingArea
        text={text}
        typedChars={typing.typedChars}
        caretIndex={typing.caret}
        otherCarets={Object.entries(otherProgress).reduce(
          (acc, [id, data]) => ({
            ...acc,
            [id]: { caret: data.caret, color: getPlayerColor(id) },
          }),
          {},
        )}
      />
    </div>
  );
}
