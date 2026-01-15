import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinRace } from "@/app/(auth)/actions/race";

export function JoinRaceButton() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    if (!code.trim()) return;

    setLoading(true);
    try {
      await joinRace(code.toUpperCase());
      router.push(`/race/${code.toUpperCase()}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to join race:", error);
      alert(error.message || "Failed to join race");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter race code"
        maxLength={6}
        className="px-4 py-2 bg-gray-800 rounded-lg font-mono uppercase"
      />
      <button
        onClick={handleJoin}
        disabled={loading || !code.trim()}
        className="px-6 py-2 bg-primary text-black rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Joining..." : "Join"}
      </button>
    </div>
  );
}
