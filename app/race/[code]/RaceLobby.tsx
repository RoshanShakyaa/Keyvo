"use client";

import { Check, Copy, Crown, Users } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import * as Ably from "ably";
import type { PresenceMessage } from "ably";
import { useTestEngine } from "@/hooks/useTestEngine";
import { RACER_COLORS } from "@/lib/types";
import KeyboardUI from "@/components/KeyboardUI";
import { finishRace, endRace, startRace, createRace } from "@/app/actions/race";
import { Caret } from "./_components/MultiplayerCaret";

type RaceCoreProps = {
  raceCode: string;
  words: string[];
  isHost: boolean;
  userId: string;
  userName: string;
  duration: number;
  settings?: {
    punctuation: boolean;
    numbers: boolean;
  };
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
  const [copied, setCopied] = useState(false);
  const [presenceSet, setPresenceSet] = useState<PresenceMessage[]>([]);
  const [status, setStatus] = useState<
    "LOBBY" | "COUNTDOWN" | "RACING" | "FINISHED"
  >("LOBBY");
  const [countdown, setCountdown] = useState(3);
  const [otherProgress, setOtherProgress] = useState<
    Record<string, { caret: number; wpm: number; finished: boolean }>
  >({});
  const [finalResults, setFinalResults] = useState<
    Array<{ name: string; wpm: number; accuracy: number; clientId: string }>
  >([]);
  const [rematchVotes, setRematchVotes] = useState<Set<string>>(new Set());
  const [rematchInProgress, setRematchInProgress] = useState(false);

  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const hasFinishedRef = useRef(false);

  const { text, typing, timer, results } = useTestEngine(
    words,
    duration,
    "time",
  );

  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textWrapperRef = useRef<HTMLDivElement>(null);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [otherCaretPositions, setOtherCaretPositions] = useState<
    Record<string, { top: number; left: number }>
  >({});

  /**
   * FIXED WPM CALCULATION
   * Uses (Correct Chars / 5) / (Elapsed Minutes)
   */
  const calculateWpm = (correctChars: number, timeLeftSeconds: number) => {
    const elapsedSeconds = duration - timeLeftSeconds;
    // Avoid division by zero and wild fluctuations in the first 2 seconds
    if (elapsedSeconds < 2 || correctChars === 0) return 0;

    const minutesElapsed = elapsedSeconds / 60;
    const wordsTyped = correctChars / 5;
    return Math.round(wordsTyped / minutesElapsed);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(raceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPlayerColor = (clientId: string) => {
    const index = presenceSet.findIndex((p) => p.clientId === clientId);
    return RACER_COLORS[index % RACER_COLORS.length];
  };

  const handleRematchVote = () => {
    if (!channelRef.current) return;
    channelRef.current.publish("rematch:vote", {});
    setRematchVotes((prev) => new Set(prev).add(userId));
  };

  const handleCreateRematch = async () => {
    if (!isHost || rematchInProgress) return;
    setRematchInProgress(true);
    try {
      // Create new race with existing settings
      const { code: newRaceCode } = await createRace({
        duration,
        punctuation: settings.punctuation,
        numbers: settings.numbers,
      });

      // Notify all players via Ably to redirect
      channelRef.current?.publish("rematch:created", { newRaceCode });
    } catch (error) {
      console.error("Failed to create rematch:", error);
      setRematchInProgress(false);
    }
  };

  // Handle finish
  useEffect(() => {
    if (results && status === "RACING" && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      const totalTyped = typing.typedChars.length;
      const accuracy =
        totalTyped > 0
          ? Math.round((typing.correctChars / totalTyped) * 100)
          : 0;
      const finalWpm = calculateWpm(typing.correctChars, timer.timeLeft);

      finishRace(raceCode, {
        progress: typing.caret,
        wpm: finalWpm,
        accuracy,
      }).catch(console.error);

      channelRef.current?.publish("player:finished", {
        name: userName,
        wpm: finalWpm,
        accuracy,
      });

      setTimeout(() => setStatus("FINISHED"), 0);
    }
  }, [
    results,
    status,
    raceCode,
    typing.caret,
    typing.correctChars,
    typing.typedChars,
    userName,
    timer.timeLeft,
  ]);

  // Ably setup
  useEffect(() => {
    const client = new Ably.Realtime({
      authUrl: "/api/ably/token",
      clientId: userId,
    });
    const channel = client.channels.get(`race:${raceCode}`);
    channelRef.current = channel;

    const syncPresence = async () => {
      const members = await channel.presence.get();
      setPresenceSet(members);
    };

    channel.presence.enter({ name: userName });
    channel.presence.subscribe(["enter", "leave", "update"], syncPresence);

    channel.subscribe("race:start", () => {
      setStatus("COUNTDOWN");
      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
          setStatus("RACING");
          timer.start();
          if (isHost) startRace(raceCode).catch(console.error);
        }
      }, 1000);
    });

    channel.subscribe("player:progress", (msg) => {
      if (!msg.clientId || msg.clientId === userId) return;
      setOtherProgress((prev) => ({
        ...prev,
        [msg.clientId as string]: msg.data,
      }));
    });

    channel.subscribe("player:finished", (msg) => {
      const clientId = msg.clientId as string;
      setFinalResults((prev) => {
        const filtered = prev.filter((r) => r.clientId !== clientId);
        return [...filtered, { ...msg.data, clientId }];
      });
    });

    channel.subscribe("race:end", () => setStatus("FINISHED"));

    channel.subscribe("rematch:vote", (msg) => {
      setRematchVotes((prev) => new Set(prev).add(msg.clientId as string));
    });

    channel.subscribe("rematch:created", (msg) => {
      // Global redirect for everyone in the room
      window.location.href = `/race/${msg.data.newRaceCode}`;
    });

    syncPresence();
    return () => {
      channel.presence.leave();
      channel.unsubscribe();
    };
  }, [raceCode, userId, userName]);

  // Broadcast Progress
  useEffect(() => {
    if (status !== "RACING" || !channelRef.current) return;
    const interval = setInterval(() => {
      const currentWpm = calculateWpm(typing.correctChars, timer.timeLeft);
      channelRef.current!.publish("player:progress", {
        caret: typing.caret,
        wpm: currentWpm,
        finished: false,
      });
    }, 200);
    return () => clearInterval(interval);
  }, [status, typing.caret, typing.correctChars, timer.timeLeft]);

  // Host ends race on timer
  useEffect(() => {
    if (status === "RACING" && timer.timeLeft === 0 && isHost) {
      endRace(raceCode).catch(console.error);
      channelRef.current?.publish("race:end", {});
    }
  }, [timer.timeLeft, status, isHost, raceCode]);

  // Caret Logic
  useLayoutEffect(() => {
    const currentChar = charRefs.current[typing.caret];
    if (currentChar && containerRef.current && textWrapperRef.current) {
      const wrapperRect = textWrapperRef.current.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const absoluteTop = charRect.top - wrapperRect.top;
      const relativeLeft = charRect.left - containerRect.left;
      const lineHeight = 39;
      const currentLine = Math.floor(absoluteTop / lineHeight);

      if (currentLine >= 2) setScrollOffset((currentLine - 1) * lineHeight);
      setCaretPos({ top: absoluteTop - scrollOffset, left: relativeLeft });
    }
  }, [typing.caret, scrollOffset]);

  useLayoutEffect(() => {
    if (status !== "RACING") return;
    const positions: Record<string, { top: number; left: number }> = {};
    Object.entries(otherProgress).forEach(([clientId, data]) => {
      const otherChar = charRefs.current[data.caret];
      if (!otherChar || !textWrapperRef.current || !containerRef.current)
        return;
      const wrapperRect = textWrapperRef.current.getBoundingClientRect();
      const charRect = otherChar.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      positions[clientId] = {
        top: charRect.top - wrapperRect.top - scrollOffset,
        left: charRect.left - containerRect.left,
      };
    });
    setTimeout(() => setOtherCaretPositions(positions), 0);
  }, [otherProgress, scrollOffset, status]);

  if (status === "LOBBY") {
    return (
      <div className="w-full max-w-2xl mx-auto pt-20">
        <div className="text-center mb-12">
          <p className="text-gray-400 mb-2">Race Code</p>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-5xl font-bold tracking-wider">{raceCode}</h1>
            <button
              onClick={copyCode}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="size-6 text-green-500" />
              ) : (
                <Copy className="size-6" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-3">Race Settings</h3>
          <div className="space-y-2 text-gray-300">
            <p>
              ⏱️ Duration:{" "}
              <span className="text-white font-medium">{duration}s</span>
            </p>
            <p>
              📝 Words:{" "}
              <span className="text-white font-medium">{words.length}</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="size-5" />
            <h3 className="text-lg font-semibold">
              Players ({presenceSet.length}/5)
            </h3>
          </div>
          <div className="space-y-2">
            {presenceSet.map((member, idx) => (
              <div
                key={member.clientId}
                className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg"
                style={{
                  borderLeft: `4px solid ${getPlayerColor(member.clientId || "")}`,
                }}
              >
                {idx === 0 && <Crown className="size-4 text-yellow-500" />}
                <span className="font-medium">
                  {member.data?.name || "Anonymous"}
                </span>
                {member.clientId === userId && (
                  <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                    YOU
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <button
            onClick={() => channelRef.current?.publish("race:start", {})}
            disabled={presenceSet.length < 2}
            className="w-full mt-8 px-6 py-4 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {presenceSet.length < 2 ? "Waiting for players..." : "Start Race"}
          </button>
        )}
      </div>
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
    const totalTyped = typing.typedChars.length;
    const myAccuracy =
      totalTyped > 0 ? Math.round((typing.correctChars / totalTyped) * 100) : 0;
    const myFinalWpm = calculateWpm(typing.correctChars, timer.timeLeft);

    const allResults = new Map();
    finalResults.forEach((r) => allResults.set(r.clientId, r));
    allResults.set(userId, {
      name: userName,
      wpm: myFinalWpm,
      accuracy: myAccuracy,
      clientId: userId,
    });

    const sortedResults = Array.from(allResults.values()).sort(
      (a, b) => b.wpm - a.wpm,
    );

    return (
      <div className="w-full max-w-3xl mx-auto pt-12">
        <h1 className="text-4xl font-bold text-center mb-8">Race Complete!</h1>
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Final Results</h2>
          <div className="space-y-3">
            {sortedResults.map((result, idx) => (
              <div
                key={result.clientId}
                className={`flex items-center gap-4 p-4 rounded-lg ${result.clientId === userId ? "bg-primary/10 border border-primary/30" : "bg-gray-900/50"}`}
              >
                <div className="text-2xl font-bold w-8">
                  {idx === 0
                    ? "🥇"
                    : idx === 1
                      ? "🥈"
                      : idx === 2
                        ? "🥉"
                        : `#${idx + 1}`}
                </div>
                <div className="flex-1 font-semibold">
                  {result.name} {result.clientId === userId && "(You)"}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {result.wpm} WPM
                  </p>
                  <p className="text-sm text-gray-400">
                    {result.accuracy}% accuracy
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Rematch</h3>
            <div className="text-sm text-gray-400">
              {rematchVotes.size} / {presenceSet.length} ready
            </div>
          </div>
          <div className="flex gap-3">
            {isHost ? (
              <button
                onClick={handleCreateRematch}
                disabled={rematchInProgress}
                className="flex-1 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {rematchInProgress ? "Creating..." : "Start Rematch"}
              </button>
            ) : (
              <button
                onClick={handleRematchVote}
                disabled={rematchVotes.has(userId)}
                className="flex-1 px-6 py-3 bg-primary/20 text-primary font-semibold rounded-lg hover:bg-primary/30 disabled:opacity-50"
              >
                {rematchVotes.has(userId) ? "✓ Voted" : "Vote for Rematch"}
              </button>
            )}
            <button
              onClick={() => (window.location.href = "/")}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myWpm = calculateWpm(typing.correctChars, timer.timeLeft);

  return (
    <div className="w-full flex flex-col flex-1">
      <div className="flex items-center justify-between mb-8">
        <div className="text-3xl font-bold">{timer.timeLeft}s</div>
        <div className="flex gap-4">
          {presenceSet.map((member) => {
            const cid = member.clientId || "";
            const progress =
              cid === userId ? { wpm: myWpm } : otherProgress[cid];
            return (
              <div
                key={cid}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg"
                style={{ borderLeft: `3px solid ${getPlayerColor(cid)}` }}
              >
                <span className="text-sm">{member.data?.name}</span>
                <span className="text-primary font-bold">
                  {progress?.wpm || 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-lg text-2xl leading-relaxed font-mono select-none overflow-hidden h-[117px]"
      >
        <motion.div
          className="absolute pointer-events-none"
          animate={{ top: caretPos.top, left: caretPos.left }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Caret color={getPlayerColor(userId)} />
        </motion.div>

        {Object.entries(otherCaretPositions).map(([cid, pos]) => (
          <div
            key={cid}
            className="absolute pointer-events-none transition-all duration-150 ease-out"
            style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
          >
            <Caret color={getPlayerColor(cid)} />
          </div>
        ))}

        <div
          ref={textWrapperRef}
          className="relative transition-transform duration-150 ease-out"
          style={{ transform: `translateY(-${scrollOffset}px)` }}
        >
          {text.split("").map((char, i) => {
            const typed = typing.typedChars[i];
            const color = typed
              ? typed.correct
                ? "text-primary"
                : "text-red-900"
              : "text-gray-500";
            return (
              <span
                key={i}
                ref={(el) => {
                  charRefs.current[i] = el;
                }}
                className={`${color} transition-colors`}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>
      <KeyboardUI />
    </div>
  );
}
