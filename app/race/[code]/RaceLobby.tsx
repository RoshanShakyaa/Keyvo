"use client";

import { useEffect, useState, useRef } from "react";
import {
  BaseRealtime,
  WebSocketTransport,
  FetchRequest,
  RealtimePresence,
} from "ably/modular";
// Import Types separately to avoid local declaration conflicts
import type { RealtimeChannel } from "ably";
import { useTestEngine } from "@/hooks/useTestEngine";
import KeyboardUI from "@/components/KeyboardUI";
import { Results } from "@/app/_components/Result";
import { Copy, Check, Users } from "lucide-react";

const RACER_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

interface RaceCoreProps {
  words: string[];
  raceCode: string;
  isHost: boolean;
  userId: string;
  userName: string;
}

export default function RaceCore({
  words,
  raceCode,
  isHost,
  userId,
  userName,
}: RaceCoreProps) {
  // --- ABLY & RACE STATE ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [presenceSet, setPresenceSet] = useState<any[]>([]);
  const [otherProgress, setOtherProgress] = useState<
    Record<string, { caret: number; wpm: number }>
  >({});
  const [status, setStatus] = useState<
    "WAITING" | "COUNTDOWN" | "RACING" | "FINISHED"
  >("WAITING");
  const [countdown, setCountdown] = useState(3);
  const [copied, setCopied] = useState(false);

  // --- TYPING ENGINE ---
  const { text, typing, timer, results } = useTestEngine(words, 60, "time");

  // --- REFS & COORDINATES ---
  // Use Types.RealtimeChannelPromise for the channel ref
  const channelRef = useRef<RealtimeChannel | null>(null);
  const ablyClientRef = useRef<BaseRealtime | null>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [caretCoords, setCaretCoords] = useState<
    Record<string, { top: number; left: number }>
  >({});

  // --- CALC POSITIONS ---
  useEffect(() => {
    const updateCoords = () => {
      const newCoords: Record<string, { top: number; left: number }> = {};
      const getPos = (index: number) => {
        const el = charRefs.current[index];
        if (!el || !el.parentElement) return null;
        const rect = el.getBoundingClientRect();
        const parentRect = el.parentElement.getBoundingClientRect();
        return {
          top: rect.top - parentRect.top,
          left: rect.left - parentRect.left,
        };
      };

      const myPos = getPos(typing.caret);
      if (myPos) newCoords[userId] = myPos;

      Object.entries(otherProgress).forEach(([pId, data]) => {
        const pos = getPos(data.caret);
        if (pos) newCoords[pId] = pos;
      });

      setCaretCoords(newCoords);
    };

    updateCoords();
    window.addEventListener("resize", updateCoords);
    return () => window.removeEventListener("resize", updateCoords);
  }, [typing.caret, otherProgress, userId]);

  // --- ABLY LOGIC ---
  useEffect(() => {
    if (ablyClientRef.current) return;

    const client = new BaseRealtime({
      authUrl: "/api/ably/token",
      clientId: userId,
      plugins: {
        WebSocketTransport,
        FetchRequest,
        RealtimePresence,
      },
    });
    ablyClientRef.current = client;

    const channel = client.channels.get(`race:${raceCode}`);
    channelRef.current = channel;

    const syncPresence = async () => {
      const members = await channel.presence.get();
      setPresenceSet([...members]);
    };

    channel.subscribe("race:start", () => {
      setStatus("COUNTDOWN");
      let count = 3;
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

    channel.subscribe("player:progress", (message) => {
      // FIX: Check if clientId exists before using it as a key
      if (message.clientId && message.clientId !== userId) {
        setOtherProgress((prev) => ({
          ...prev,
          [message.clientId as string]: message.data,
        }));
      }
    });

    channel.presence.subscribe(["enter", "leave", "present"], syncPresence);
    channel.presence.enter({ name: userName });

    return () => {
      channel.unsubscribe();
      channel.presence.leave();
      client.close();
      ablyClientRef.current = null;
    };
  }, [raceCode, userName, userId, timer]);

  // Broadcast progress
  useEffect(() => {
    if (status === "RACING" && channelRef.current) {
      const interval = setInterval(() => {
        const elapsed = 60 - timer.timeLeft;
        const wpm =
          elapsed > 0
            ? Math.round(typing.correctChars / 5 / (elapsed / 60))
            : 0;
        channelRef.current?.publish("player:progress", {
          caret: typing.caret,
          wpm,
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [status, typing.caret, typing.correctChars, timer.timeLeft]);

  // --- HELPERS ---
  const getPlayerColor = (pId: string) => {
    const idx = presenceSet.findIndex((m) => m.clientId === pId);
    return RACER_COLORS[idx % RACER_COLORS.length] || "#FFF";
  };

  const copyCode = () => {
    navigator.clipboard.writeText(raceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- RENDER ---
  if (results)
    return <Results {...results} onRestart={() => window.location.reload()} />;

  if (status === "COUNTDOWN") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <h1 className="text-[12rem] font-black text-primary animate-bounce">
          {countdown}
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {status === "WAITING" ? (
        <div className="flex flex-col items-center justify-center space-y-8 py-20 bg-gray-900/30 rounded-3xl border border-gray-800">
          <div className="text-center">
            <h2 className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-2">
              Lobby Joined
            </h2>
            <div className="flex items-center gap-3 justify-center">
              <h1 className="text-5xl font-black text-white">{raceCode}</h1>
              <button
                onClick={copyCode}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="text-green-500" />
                ) : (
                  <Copy className="text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
            {presenceSet.map((m) => (
              <div
                key={m.clientId}
                className="flex items-center gap-3 px-5 py-3 bg-gray-900 border border-gray-800 rounded-2xl"
                style={{
                  borderLeft: `4px solid ${getPlayerColor(m.clientId)}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: getPlayerColor(m.clientId) }}
                />
                <span className="font-bold">{m.data?.name}</span>
                {m.clientId === userId && (
                  <span className="text-xs text-gray-600">YOU</span>
                )}
              </div>
            ))}
          </div>

          {isHost ? (
            <button
              onClick={() => channelRef.current?.publish("race:start", {})}
              className="px-12 py-4 bg-primary text-black font-black rounded-2xl hover:scale-105 transition-transform"
            >
              START ENGINE
            </button>
          ) : (
            <p className="text-gray-500 animate-pulse">
              Waiting for host to start...
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
          <div className="lg:col-span-3 relative">
            <div className="mb-10 flex justify-between items-center">
              <div className="text-5xl font-black text-white/20">
                {timer.timeLeft}s
              </div>
              <div className="flex items-center gap-2 text-primary font-mono bg-primary/10 px-4 py-2 rounded-lg">
                <Users size={16} /> {presenceSet.length} RACERS
              </div>
            </div>

            <div className="relative rounded-xl bg-gray-900/20 p-2 min-h-[140px]">
              {Object.entries(caretCoords).map(([pId, pos]) => {
                const isMe = pId === userId;
                const color = getPlayerColor(pId);
                const name =
                  presenceSet.find((m) => m.clientId === pId)?.data?.name ||
                  "Racer";

                return (
                  <div
                    key={pId}
                    className="absolute transition-all duration-150 ease-out z-10"
                    style={{ top: pos.top, left: pos.left }}
                  >
                    <div
                      className={`h-9 w-0.5 ${
                        isMe ? "animate-pulse" : "opacity-40"
                      }`}
                      style={{
                        backgroundColor: color,
                        boxShadow: isMe ? `0 0 15px ${color}` : "none",
                      }}
                    />
                    <div
                      className={`absolute -top-7 left-0 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-xl ${
                        isMe ? "opacity-100" : "opacity-40"
                      }`}
                      style={{ backgroundColor: color, color: "#000" }}
                    >
                      {isMe ? "YOU" : name}
                    </div>
                  </div>
                );
              })}

              <div className="text-3xl font-mono leading-relaxed select-none outline-none">
                {text.split("").map((char, i) => {
                  const typed = typing.typedChars[i];
                  let color = "text-gray-600";
                  if (typed)
                    color = typed.correct ? "text-white" : "text-red-500";
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

            <div className="mt-20">
              <KeyboardUI />
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-3xl border border-gray-800 p-6">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">
              Live Rankings
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div
                    className="w-1 h-8 rounded-full"
                    style={{ backgroundColor: getPlayerColor(userId) }}
                  />
                  <span className="font-bold text-sm">YOU</span>
                </div>
                <span className="font-mono text-primary font-bold">
                  {Math.round(
                    typing.correctChars / 5 / ((60 - timer.timeLeft) / 60)
                  ) || 0}{" "}
                  <span className="text-[10px] text-gray-500 uppercase">
                    WPM
                  </span>
                </span>
              </div>
              {Object.entries(otherProgress).map(([pId, data]) => (
                <div
                  key={pId}
                  className="flex justify-between items-center opacity-70"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: getPlayerColor(pId) }}
                    />
                    <span className="font-bold text-sm truncate max-w-[80px]">
                      {presenceSet.find((m) => m.clientId === pId)?.data
                        ?.name || "Racer"}
                    </span>
                  </div>
                  <span className="font-mono font-bold">
                    {data.wpm}{" "}
                    <span className="text-[10px] text-gray-500 uppercase">
                      WPM
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
