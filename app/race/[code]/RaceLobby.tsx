"use client";

import { Check, Copy, Crown, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Ably from "ably";
import { useTestEngine } from "@/hooks/useTestEngine";
import { RACER_COLORS } from "@/lib/types";
import KeyboardUI from "@/components/KeyboardUI";
import { finishRace } from "@/app/actions/race";
import { Caret } from "./_components/MultiplayerCaret";

type RaceCoreProps = {
  raceCode: string;
  words: string[];
  isHost: boolean;
  userId: string;
  userName: string;
  duration: number;
};

export function RaceCore({
  raceCode,
  words,
  isHost,
  userId,
  userName,
  duration,
}: RaceCoreProps) {
  const [copied, setCopied] = useState(false);
  const [presenceSet, setPresenceSet] = useState<Ably.PresenceMessage[]>([]);
  const [status, setStatus] = useState<"LOBBY" | "COUNTDOWN" | "RACING" | "FINISHED">("LOBBY");
  const [countdown, setCountdown] = useState(3);
  const [otherProgress, setOtherProgress] = useState<
    Record<string, { caret: number; wpm: number; finished: boolean }>
  >({});
  const [finalResults, setFinalResults] = useState<
    Array<{ name: string; wpm: number; accuracy: number; clientId: string }>
  >([]);

  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const hasFinishedRef = useRef(false);
  const { text, typing, timer, results } = useTestEngine(words, duration, "time");
  
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textWrapperRef = useRef<HTMLDivElement>(null);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [otherCaretPositions, setOtherCaretPositions] = useState<
    Record<string, { top: number; left: number }>
  >({});

  const copyCode = () => {
    navigator.clipboard.writeText(raceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPlayerColor = (clientId: string) => {
    const index = presenceSet.findIndex((p) => p.clientId === clientId);
    return RACER_COLORS[index % RACER_COLORS.length];
  };

  // Handle finish - use callback to avoid setState in effect
  useEffect(() => {
    if (results && status === "RACING" && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      
      const totalTyped = typing.typedChars.length;
      const accuracy = totalTyped > 0 
        ? Math.round((typing.correctChars / totalTyped) * 100) 
        : 0;
      
      // Save to database
      finishRace(raceCode, {
        progress: typing.caret,
        wpm: results.wpm,
        accuracy,
      }).catch(console.error);

      // Broadcast finish
      channelRef.current?.publish("player:finished", {
        name: userName,
        wpm: results.wpm,
        accuracy,
      });

      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setStatus("FINISHED");
      }, 0);
    }
  }, [results, status, raceCode, typing.caret, typing.correctChars, typing.typedChars, userName]);

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

    // Race start
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
        }
      }, 1000);
    });

    // Player progress updates
    channel.subscribe("player:progress", (msg) => {
      if (!msg.clientId || msg.clientId === userId) return;
      setOtherProgress((prev) => ({
        ...prev,
        [msg.clientId]: msg.data,
      }));
    });

    // Player finished
    channel.subscribe("player:finished", (msg) => {
      setFinalResults((prev) => [
        ...prev.filter((r) => r.clientId !== msg.clientId),
        { ...msg.data, clientId: msg.clientId },
      ]);
    });

    // Race ended by host (timer expired)
    channel.subscribe("race:end", () => {
      setStatus("FINISHED");
    });

    syncPresence();

    return () => {
      channel.presence.leave();
      channel.unsubscribe();
    };
  }, [raceCode, userId, userName]);

  // Send progress updates (Ably only - NO database writes)
  useEffect(() => {
    if (status !== "RACING" || !channelRef.current) return;

    const interval = setInterval(() => {
      const elapsedTime = duration - timer.timeLeft;
      const currentWpm = elapsedTime > 0 && typing.correctChars > 0
        ? Math.round(((typing.correctChars / 5) * 60) / elapsedTime)
        : 0;

      // Only broadcast via Ably - NO database call
      channelRef.current!.publish("player:progress", {
        caret: typing.caret,
        wpm: currentWpm,
        finished: false,
      });
    }, 200);

    return () => clearInterval(interval);
  }, [status, typing.caret, typing.correctChars, timer.timeLeft, duration]);

  // Timer end - host ends race
  useEffect(() => {
    if (status === "RACING" && timer.timeLeft === 0 && isHost) {
      channelRef.current?.publish("race:end", {});
    }
  }, [timer.timeLeft, status, isHost]);

  // Caret position calculation
  useEffect(() => {
    const currentChar = charRefs.current[typing.caret];

    if (currentChar && containerRef.current && textWrapperRef.current) {
      const wrapperRect = textWrapperRef.current.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const absoluteTop = charRect.top - wrapperRect.top;
      const relativeLeft = charRect.left - containerRect.left;

      const lineHeight = 39;
      const currentLine = Math.floor(absoluteTop / lineHeight);

      if (currentLine >= 2) {
        const newOffset = (currentLine - 1) * lineHeight;
        setScrollOffset(newOffset);
      }

      setCaretPos({
        top: absoluteTop - scrollOffset,
        left: relativeLeft,
      });
    }
  }, [typing.caret, scrollOffset]);

  // Calculate other players' caret positions
  useEffect(() => {
    const positions: Record<string, { top: number; left: number }> = {};

    Object.entries(otherProgress).forEach(([clientId, data]) => {
      const otherChar = charRefs.current[data.caret];
      if (!otherChar || !textWrapperRef.current || !containerRef.current) return;

      const wrapperRect = textWrapperRef.current.getBoundingClientRect();
      const charRect = otherChar.getBoundingClientRect();

      const absoluteTop = charRect.top - wrapperRect.top;
      const relativeLeft = charRect.left - containerRef.current.getBoundingClientRect().left;

      positions[clientId] = {
        top: absoluteTop - scrollOffset,
        left: relativeLeft,
      };
    });

    setOtherCaretPositions(positions);
  }, [otherProgress, scrollOffset]);

  // ========== LOBBY ==========
  if (status === "LOBBY") {
    return (
      <div className="w-full max-w-2xl mx-auto pt-20">
        {/* Race Code */}
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

        {/* Race Settings */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-3">Race Settings</h3>
          <div className="space-y-2 text-gray-300">
            <p>⏱️ Duration: <span className="text-white font-medium">{duration}s</span></p>
            <p>📝 Words: <span className="text-white font-medium">{words.length}</span></p>
          </div>
        </div>

        {/* Players */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="size-5" />
            <h3 className="text-lg font-semibold">
              Players ({presenceSet.length}/5)
            </h3>
          </div>
          <div className="space-y-2">
            {presenceSet.map((member, idx) => {
              const isMe = member.clientId === userId;
              const isRoomHost = idx === 0;
              
              return (
                <div
                  key={member.clientId}
                  className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg"
                  style={{
                    borderLeft: `4px solid ${getPlayerColor(member.clientId || "")}`,
                  }}
                >
                  {isRoomHost && <Crown className="size-4 text-yellow-500" />}
                  <span className="font-medium">
                    {member.data?.name || "Anonymous"}
                  </span>
                  {isMe && (
                    <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                      YOU
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        {isHost && (
          <button
            onClick={() => channelRef.current?.publish("race:start", {})}
            disabled={presenceSet.length < 2}
            className="w-full mt-8 px-6 py-4 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {presenceSet.length < 2 ? "Waiting for players..." : "Start Race"}
          </button>
        )}

        {!isHost && (
          <div className="text-center mt-8 text-gray-400">
            Waiting for host to start the race...
          </div>
        )}
      </div>
    );
  }

  // ========== COUNTDOWN ==========
  if (status === "COUNTDOWN") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-9xl font-black text-primary animate-pulse">
          {countdown}
        </div>
      </div>
    );
  }

  // ========== FINISHED ==========
  if (status === "FINISHED") {
    const totalTyped = typing.typedChars.length;
    const myAccuracy = totalTyped > 0 
      ? Math.round((typing.correctChars / totalTyped) * 100) 
      : 0;

    const sortedResults = [
      ...finalResults,
      results && {
        name: userName,
        wpm: results.wpm,
        accuracy: myAccuracy,
        clientId: userId,
      },
    ]
      .filter(Boolean)
      .sort((a, b) => b!.wpm - a!.wpm);

    return (
      <div className="w-full max-w-3xl mx-auto pt-12">
        <h1 className="text-4xl font-bold text-center mb-8">Race Complete!</h1>

        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Final Results</h2>
          <div className="space-y-3">
            {sortedResults.map((result, idx) => {
              if (!result) return null;
              const isMe = result.clientId === userId;
              const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";

              return (
                <div
                  key={result.clientId}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    isMe ? "bg-primary/10 border border-primary/30" : "bg-gray-900/50"
                  }`}
                >
                  <div className="text-2xl font-bold w-8">{medal || `#${idx + 1}`}</div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {result.name} {isMe && "(You)"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{result.wpm} WPM</p>
                    <p className="text-sm text-gray-400">{result.accuracy}% accuracy</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========== RACING ==========
  const elapsedTime = duration - timer.timeLeft;
  const myWpm = elapsedTime > 0 && typing.correctChars > 0
    ? Math.round(((typing.correctChars / 5) * 60) / elapsedTime)
    : 0;

  return (
    <div className="w-full flex flex-col flex-1">
      {/* Timer & Leaderboard */}
      <div className="flex items-center justify-between mb-8">
        <div className="text-3xl font-bold">{timer.timeLeft}s</div>
        
        {/* Live Leaderboard */}
        <div className="flex gap-4">
          {presenceSet.map((member) => {
            const clientId = member.clientId || "";
            const isMe = clientId === userId;
            const progress = isMe
              ? { wpm: myWpm }
              : otherProgress[clientId];

            return (
              <div
                key={clientId}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg"
                style={{ borderLeft: `3px solid ${getPlayerColor(clientId)}` }}
              >
                <span className="text-sm">{member.data?.name}</span>
                <span className="text-primary font-bold">{progress?.wpm || 0}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Typing Area */}
      <div
        ref={containerRef}
        className="relative rounded-lg text-2xl leading-relaxed font-mono select-none overflow-hidden"
        style={{ height: "117px" }}
      >
        {/* Self caret */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: `${caretPos.top}px`,
            left: `${caretPos.left}px`,
          }}
        >
          <Caret color={getPlayerColor(userId)} />
        </div>

        {/* Other players' carets */}
        {Object.entries(otherCaretPositions).map(([clientId, pos]) => {
          return (
            <div
              key={clientId}
              className="absolute pointer-events-none"
              style={{
                top: `${pos.top}px`,
                left: `${pos.left}px`,
              }}
            >
              <Caret color={getPlayerColor(clientId)} />
            </div>
          );
        })}

        <div
          ref={textWrapperRef}
          className="relative transition-transform duration-150 ease-out"
          style={{ transform: `translateY(-${scrollOffset}px)` }}
        >
          {text.split("").map((char, i) => {
            const typed = typing.typedChars[i];
            let color = "text-gray-500";

            if (typed) {
              color = typed.correct ? "text-primary" : "text-red-900";
            }

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