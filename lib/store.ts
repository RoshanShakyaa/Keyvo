// lib/store.ts
import { create } from "zustand";

interface keyboardStore {
  display: boolean;
  toggleKeyboard: () => void;
}

interface ToolkitStore {
  mode: "time" | "words"; // Add mode
  time: number;
  words: number;
  punctuation: boolean;
  number: boolean;
  setMode: (mode: "time" | "words") => void; // Add setter
  setTime: (count: number) => void;
  setWords: (count: number) => void;
  togglePunctuation: () => void;
  toggleNumber: () => void;
}

export const useKeyboardUIStore = create<keyboardStore>((set) => ({
  display: false,
  toggleKeyboard: () => set((state) => ({ display: !state.display })),
}));

export const useToolkitStore = create<ToolkitStore>((set) => ({
  mode: "time", // Default to time mode
  time: 15,
  words: 10,
  punctuation: false,
  number: false,
  setMode: (mode: "time" | "words") => set(() => ({ mode })),
  setTime: (count: number) => set(() => ({ time: count, mode: "time" })), // Auto-switch to time mode
  setWords: (count: number) => set(() => ({ words: count, mode: "words" })), // Auto-switch to words mode
  togglePunctuation: () =>
    set((state) => ({ punctuation: !state.punctuation })),
  toggleNumber: () => set((state) => ({ number: !state.number })),
}));
