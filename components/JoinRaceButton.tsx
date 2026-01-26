import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinRace } from "@/app/actions/race";

export function JoinRaceButton() {
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleJoin = () => {
    if (!code.trim()) return;

    startTransition(async () => {
      await joinRace(code.toUpperCase());
      router.push(`/race/${code.toUpperCase()}`);
    });
  };

  return (
    <div className="flex gap-2 ">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={6}
        className="px-4 py-2 bg-input rounded font-mono uppercase"
      />

      <button
        onClick={handleJoin}
        disabled={isPending}
        className="px-6 py-2 bg-primary  rounded font-semibold disabled:opacity-50"
      >
        {isPending ? "Joining..." : "Join"}
      </button>
    </div>
  );
}
