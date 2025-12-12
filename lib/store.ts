import { create } from "zustand";

interface keyboardStore {
  display: boolean;
  toggleKeyboard: () => void;
}
interface toolkitStore {
  time: number;
  words: number;
  punctuation: boolean;
  number: boolean;
}

export const useKeyboardUIStore = create<keyboardStore>((set) => ({
  display: false,
  toggleKeyboard: () => set((state) => ({ display: !state.display })),
}));
