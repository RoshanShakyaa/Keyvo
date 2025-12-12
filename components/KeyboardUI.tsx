"use client";
import { BigKeyboard } from "@/components/ui/keyboard";
import { useKeyboardUIStore } from "@/lib/store";

const KeyboardUI = () => {
  const keyboard = useKeyboardUIStore((state) => state.display);

  return <div className="mt-30">{keyboard && <BigKeyboard />}</div>;
};

export default KeyboardUI;
