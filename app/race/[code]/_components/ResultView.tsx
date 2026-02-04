// _components/ResultsView.tsx
import { Crown } from "lucide-react";

interface Participant {
  clientId: string;
  name: string;
  wpm: number;
  accuracy: number;
}

interface ResultsViewProps {
  results: Participant[];
  userId: string;
  isHost: boolean;
  rematchVotes: number;
  totalPlayers: number;
  hasVoted: boolean;
  onVoteRematch: () => void;
  onCreateRematch: () => void;
  isCreatingRematch: boolean;
}

export function ResultsView({
  results,
  userId,
  isHost,
  rematchVotes,
  totalPlayers,
  hasVoted,
  onVoteRematch,
  onCreateRematch,
  isCreatingRematch,
}: ResultsViewProps) {
  // Sort results by WPM descending
  const sortedResults = [...results].sort((a, b) => b.wpm - a.wpm);

  return (
    <div className="w-full max-w-3xl mx-auto pt-12 animate-in fade-in zoom-in duration-300">
      <h1 className="text-4xl font-bold text-center mb-8">Race Complete!</h1>

      <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-white/10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Crown className="text-yellow-500" /> Leaderboard
        </h2>
        <div className="space-y-3">
          {sortedResults.map((result, idx) => (
            <div
              key={result.clientId}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                result.clientId === userId
                  ? "bg-primary/20 border border-primary/40"
                  : "bg-gray-900/50 border border-transparent"
              }`}
            >
              <div className="text-2xl font-bold w-10">
                {idx === 0
                  ? "🥇"
                  : idx === 1
                    ? "🥈"
                    : idx === 2
                      ? "🥉"
                      : `#${idx + 1}`}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">
                  {result.name} {result.clientId === userId && "(You)"}
                </p>
                <p className="text-sm text-gray-400">
                  {result.accuracy}% accuracy
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-primary">{result.wpm}</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  WPM
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rematch Section */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Rematch</h3>
            <p className="text-sm text-gray-400">Ready to go again?</p>
          </div>
          <div className="bg-gray-900 px-4 py-2 rounded-full text-sm font-mono border border-white/10">
            {rematchVotes} / {totalPlayers} Ready
          </div>
        </div>

        <div className="flex gap-4">
          {isHost ? (
            <button
              onClick={onCreateRematch}
              disabled={isCreatingRematch}
              className="flex-1 px-6 py-4 bg-primary text-black font-black rounded-lg hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
            >
              {isCreatingRematch ? "GENERATING RACE..." : "START REMATCH"}
            </button>
          ) : (
            <button
              onClick={onVoteRematch}
              disabled={hasVoted}
              className="flex-1 px-6 py-4 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50 disabled:bg-green-500/20 disabled:text-green-500"
            >
              {hasVoted ? "✓ READY FOR REMATCH" : "VOTE FOR REMATCH"}
            </button>
          )}
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
