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
  initialStatus = "LOBBY", // ← Add this prop to pass DB status
}: RaceCoreProps) {
  // --- 1. State ---
  const [presenceSet, setPresenceSet] = useState<PresenceMessage[]>([]);
  const [status, setStatus] = useState<
    "LOBBY" | "COUNTDOWN" | "RACING" | "FINISHED"
  >(initialStatus ?? "LOBBY"); // ← Initialize with DB status, fallback to LOBBY
  const [countdown, setCountdown] = useState(3);
  const [otherProgress, setOtherProgress] = useState<
    Record<string, { caret: number; wpm: number }>
  >({});
  const [finalResults, setFinalResults] = useState<ParticipantResult[]>([]);
  const [rematchVotes, setRematchVotes] = useState<Set<string>>(new Set());
  const [rematchInProgress, setRematchInProgress] = useState(false);

  // --- NEW: Smoothed WPM state to prevent UI flicker ---
  const [displayWpm, setDisplayWpm] = useState(0);

  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const hasFinishedRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timerRef = useRef<any>(null);
  const isCleaningUpRef = useRef(false);
  const hasStartedRaceRef = useRef(false);

  const { text, typing, timer, results } = useTestEngine(
    words,
    duration,
    "time",
  );

  // --- START TIMER ON MOUNT IF RACE IS ALREADY RUNNING ---
  useEffect(() => {
    if (initialStatus === "RACING" && status === "RACING") {
      timer.start();
    }
  }, []); // Only run once on mount

  // --- 2. Corrected WPM Logic ---
  // Standard WPM = (Correct Chars / 5) / (Minutes Elapsed)
  // We use a separate effect to update the UI only every 500ms
  useEffect(() => {
    if (status !== "RACING") return;

    const interval = setInterval(() => {
      const firstCharTime = typing.typedChars[0]?.timestamp;
      if (!firstCharTime) return;

      const elapsedSeconds = (Date.now() - firstCharTime) / 1000;
      if (elapsedSeconds < 1) return;

      const currentWpm = Math.round(
        typing.correctChars / 5 / (elapsedSeconds / 60),
      );
      setDisplayWpm(currentWpm);
    }, 500); // Only updates twice per second

    return () => clearInterval(interval);
  }, [status, typing.correctChars, typing.typedChars]);

  const accuracy =
    typing.totalKeysPressed === 0
      ? 100
      : Math.round(
          ((typing.totalKeysPressed - typing.totalErrors) /
            typing.totalKeysPressed) *
            100,
        );

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
        setPresenceSet(members);
      } catch (err) {
        console.error("Error syncing presence:", err);
      }
    };

    channel.presence.enter({ name: userName }).then(() => syncPresence());
    channel.presence.subscribe(["enter", "leave", "update"], () =>
      syncPresence(),
    );

    channel.subscribe("race:start", () => {
      if (isCleaningUpRef.current) return;

      // FIXED: Host updates DB to RACING immediately (before countdown)
      // This ensures the database status is correct if anyone reloads during countdown
      if (isHost && !hasStartedRaceRef.current) {
        hasStartedRaceRef.current = true;
        startRace(raceCode).catch(console.error);
      }

      setStatus("COUNTDOWN");
      let count = 3;
      timerRef.current = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(timerRef.current);
          setStatus("RACING");
          timer.start();
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
      if (timerRef.current) clearInterval(timerRef.current);
      channel.presence.leave().catch(() => {});
      channel.unsubscribe();
    };
  }, [raceCode, userId, userName, isHost]);

  // --- 4. Live Socket Progress (Visuals Only) ---
  useEffect(() => {
    if (status !== "RACING" || !channelRef.current) return;
    const interval = setInterval(() => {
      if (isCleaningUpRef.current) return;
      channelRef.current?.publish("player:progress", {
        caret: typing.caret,
        wpm: displayWpm, // Send the smoothed Wpm
      });
    }, 200);
    return () => clearInterval(interval);
  }, [status, typing.caret, displayWpm]);

  // --- 5. Finish Logic (Database Update Here) ---
  useEffect(() => {
    if (results && status === "RACING" && !hasFinishedRef.current) {
      hasFinishedRef.current = true;

      // Ensure final database WPM matches the test engine's calculation
      const finalWpm = results.wpm;
      const finalAccuracy = results.accuracy;
      const data = { name: userName, wpm: finalWpm, accuracy: finalAccuracy };

      // UPDATE DATABASE ONCE AT FINISH - returns position
      finishRace(raceCode, { progress: typing.caret, ...data })
        .then(({ position }) => {
          console.log(`Finished in position: ${position}`);
          // You can store this in state if needed for display
        })
        .catch((err) => {
          console.error("Failed to save finish to DB:", err);
        });

      if (channelRef.current && !isCleaningUpRef.current) {
        channelRef.current.publish("player:finished", data);
      }

      if (isHost) {
        setTimeout(() => {
          if (isCleaningUpRef.current) return;
          endRace(raceCode).catch(console.error);
          channelRef.current?.publish("race:ended", {});
        }, 2000);
      }

      setStatus("FINISHED");
    }
  }, [results, status, raceCode, userName, typing.caret, isHost]);

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
    const allResults = [...finalResults];
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

  return (
    <div className="w-full flex flex-col flex-1 max-w-4xl mx-auto pt-10 px-4">
      <RaceHeader
        timeLeft={timer.timeLeft}
        players={presenceSet}
        localWpm={displayWpm} // Using smoothed WPM
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
