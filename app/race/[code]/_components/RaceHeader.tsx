// _components/RaceHeader.tsx
import { PresenceMessage } from "ably";

interface RaceHeaderProps {
  timeLeft: number;
  players: PresenceMessage[];
  localWpm: number;
  userId: string;
  otherProgress: Record<string, { caret: number; wpm: number }>;
  getPlayerColor: (id: string) => string;
}

export function RaceHeader({
  timeLeft,
  players,
  localWpm,
  userId,
  otherProgress,
  getPlayerColor,
}: RaceHeaderProps) {
  return (
    <div className="w-full mb-8 space-y-6">
      {/* Timer Display */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
            Time Remaining
          </span>
          <span className="text-4xl font-mono font-bold text-white">
            {timeLeft}s
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
            Your Speed
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-mono font-bold text-primary">
              {localWpm}
            </span>
            <span className="text-gray-400 font-bold">WPM</span>
          </div>
        </div>
      </div>

      {/* Player List with WPM */}
      <div className="space-y-2">
        {players.map((player) => {
          const id = player.clientId || "";
          const isMe = id === userId;
          const currentWpm = isMe ? localWpm : otherProgress[id]?.wpm || 0;

          return (
            <div key={id} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getPlayerColor(id) }}
                />
                <span className="text-sm">
                  {player.data?.name} {isMe && "(You)"}
                </span>
              </div>
              <span className="text-sm font-mono">{currentWpm} WPM</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
