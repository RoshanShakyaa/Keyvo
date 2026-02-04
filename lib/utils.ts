import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateWpm = (chars: number, secondsElapsed: number) => {
  if (secondsElapsed <= 0 || chars <= 0) return 0;
  return Math.round(chars / 5 / (secondsElapsed / 60));
};

export const calculateAccuracy = (total: number, correct: number) => {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
};
