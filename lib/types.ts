export type ApiResponse = {
  status: "success" | "error";
  message: string;
};
export type RaceDTO = {
  id: string;
  code: string;
  hostId: string;
  host: {
    id: string;
    name: string | null;
  };
  participants: {
    id: string;
    userId: string;
    raceId: string;
    progress: number;
    wpm: number;
    accuracy: number | null;
    finished: boolean;
    finishedAt: Date | null;
    user: {
      id: string;
      name: string | null;
    };
  }[];
  duration: number;
  status: "LOBBY" | "COUNTDOWN" | "RACING" | "FINISHED";
  words: string[];
  startTime?: string | null;
  endTime?: string | null;
};
export const RACER_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];
