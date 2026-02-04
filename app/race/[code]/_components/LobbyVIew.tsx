import { Check, Copy, Crown, Users } from "lucide-react";
import { PresenceMessage } from "ably";
import { RACER_COLORS } from "@/lib/types";
import { useState } from "react";

interface LobbyViewProps {
  raceCode: string;
  duration: number;
  wordCount: number;
  presenceSet: PresenceMessage[];
  isHost: boolean;
  userId: string;
  onStart: () => void;
}

export function LobbyView({
  raceCode,
  duration,
  wordCount,
  presenceSet,
  isHost,
  userId,
  onStart,
}: LobbyViewProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(raceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPlayerColor = (clientId: string) => {
    const index = presenceSet.findIndex((p) => p.clientId === clientId);
    return RACER_COLORS[index % RACER_COLORS.length];
  };

  return (
    <div className="w-full max-w-2xl mx-auto pt-20">
      <div className="text-center mb-12">
        <p className="text-gray-400 mb-2">Race Code</p>
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-5xl font-bold tracking-wider">{raceCode}</h1>
          <button
            onClick={copyCode}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            {copied ? <Check className="text-green-500" /> : <Copy />}
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-3">Race Settings</h3>
        <p>
          ⏱️ Duration:{" "}
          <span className="text-white font-medium">{duration}s</span>
        </p>
        <p>
          📝 Words: <span className="text-white font-medium">{wordCount}</span>
        </p>
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
                <span className="ml-auto text-xs bg-primary/20 px-2 py-1 rounded">
                  YOU
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <button
          onClick={onStart}
          disabled={presenceSet.length < 2}
          className="w-full mt-8 px-6 py-4 bg-primary text-black font-bold rounded-lg disabled:opacity-50"
        >
          {presenceSet.length < 2 ? "Waiting for players..." : "Start Race"}
        </button>
      )}
    </div>
  );
}
