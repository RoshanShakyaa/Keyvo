"use client";

import { useKeyboardUIStore, useToolkitStore } from "@/lib/store";
import { CaseUpper, Keyboard, Timer } from "lucide-react";

const ToolKit = () => {
  const toggleKeyboard = useKeyboardUIStore((s) => s.toggleKeyboard);

  const {
    number,
    punctuation,
    toggleNumber,
    togglePunctuation,
    setTime,
    setWords,
    words,
    time,
  } = useToolkitStore();

  const active = "font-semibold text-primary cursor-pointer";
  const inactive =
    "font-normal text-muted-foreground cursor-pointer hover:text-foreground";

  return (
    <div className="flex items-center gap-6 justify-center bg-secondary/50 py-2 px-6 rounded-md w-fit mx-auto">
      <button
        onClick={toggleKeyboard}
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        <Keyboard />
      </button>

      <button
        className={`cursor-pointer transition-colors ${
          punctuation
            ? "font-semibold text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={togglePunctuation}
      >
        punctuation
      </button>

      <button
        className={`cursor-pointer transition-colors ${
          number
            ? "font-semibold text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={toggleNumber}
      >
        numbers
      </button>

      <span className="text-border">|</span>
      <Timer className="size-4 text-muted-foreground" />
      <button
        className={time === 15 ? active : inactive}
        onClick={() => setTime(15)}
      >
        15
      </button>

      <button
        className={time === 30 ? active : inactive}
        onClick={() => setTime(30)}
      >
        30
      </button>

      <button
        className={time === 60 ? active : inactive}
        onClick={() => setTime(60)}
      >
        60
      </button>

      <button
        className={time === 120 ? active : inactive}
        onClick={() => setTime(120)}
      >
        120
      </button>

      <span className="text-border">|</span>
      <CaseUpper className="size-4 text-muted-foreground" />
      <button
        className={words === 15 ? active : inactive}
        onClick={() => setWords(15)}
      >
        15
      </button>

      <button
        className={words === 25 ? active : inactive}
        onClick={() => setWords(25)}
      >
        25
      </button>

      <button
        className={words === 50 ? active : inactive}
        onClick={() => setWords(50)}
      >
        50
      </button>

      <button
        className={words === 100 ? active : inactive}
        onClick={() => setWords(100)}
      >
        100
      </button>
    </div>
  );
};

export default ToolKit;
