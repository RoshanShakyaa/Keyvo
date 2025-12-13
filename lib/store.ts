import { create } from "zustand";

interface keyboardStore {
  display: boolean;
  toggleKeyboard: () => void;
}
interface ToolkitStore {
  time: number;
  words: number;
  punctuation: boolean;
  number: boolean;
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
  time: 15,
  words: 15,
  punctuation: false,
  number: false,
  setTime: (count: number) => set(() => ({ time: count })),
  setWords: (count: number) => set(() => ({ words: count })),
  togglePunctuation: () =>
    set((state) => ({ punctuation: !state.punctuation })),
  toggleNumber: () => set((state) => ({ number: !state.number })),
}));
