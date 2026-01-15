// components/CreateRaceButton.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRace } from "@/app/(auth)/actions/race";

export function CreateRaceButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { code } = await createRace();
      router.push(`/race/${code}`);
    } catch (error) {
      console.error("Failed to create race:", error);
      alert("Failed to create race");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="px-6 py-3 bg-primary text-black rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {loading ? "Creating..." : "Create Race"}
    </button>
  );
}
