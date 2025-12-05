import { create } from "zustand";

interface keyboardStore {
  display: boolean;
  toggleKeyboard: () => void;
}

export const useKeyboardUIStore = create<keyboardStore>((set) => ({
  display: false,
  toggleKeyboard: () => set((state) => ({ display: !state.display })),
}));
