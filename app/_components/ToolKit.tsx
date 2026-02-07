"use client";

import { useKeyboardUIStore, useToolkitStore } from "@/lib/store";
import { Keyboard, TimerIcon, ALargeSmall } from "lucide-react";

const ToolKit = () => {
  const toggleKeyboard = useKeyboardUIStore((s) => s.toggleKeyboard);

  const {
    mode,
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
  const inactive = "font-normal text-muted-foreground cursor-pointer";

  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 bg-background py-3 px-4 sm:px-6 rounded-md w-full lg:w-fit mx-auto border">
      {/* Top Row (Mobile/Tablet) / Left Section (Desktop) - Keyboard, Punctuation, Numbers */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 justify-center">
        <button onClick={toggleKeyboard} className="shrink-0">
          <Keyboard className="size-5" />
        </button>

        <button
          className={punctuation ? active : inactive}
          onClick={togglePunctuation}
        >
          punctuation
        </button>

        <button className={number ? active : inactive} onClick={toggleNumber}>
          numbers
        </button>
      </div>

      {/* Separator - only visible on larger screens */}
      <span className="hidden lg:inline">|</span>

      {/* Bottom Row (Mobile/Tablet) / Right Section (Desktop) - Time and Words Options */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 justify-center">
        <div className="shrink-0">
          <TimerIcon className="size-4" />
        </div>

        {/* Time Mode */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <button
            className={mode === "time" && time === 15 ? active : inactive}
            onClick={() => setTime(15)}
          >
            15
          </button>

          <button
            className={mode === "time" && time === 30 ? active : inactive}
            onClick={() => setTime(30)}
          >
            30
          </button>

          <button
            className={mode === "time" && time === 60 ? active : inactive}
            onClick={() => setTime(60)}
          >
            60
          </button>

          <button
            className={mode === "time" && time === 120 ? active : inactive}
            onClick={() => setTime(120)}
          >
            120
          </button>
        </div>

        <span className="hidden sm:inline">|</span>

        <div className="shrink-0">
          <ALargeSmall className="size-5" />
        </div>

        {/* Words Mode */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <button
            className={mode === "words" && words === 10 ? active : inactive}
            onClick={() => setWords(10)}
          >
            10
          </button>

          <button
            className={mode === "words" && words === 25 ? active : inactive}
            onClick={() => setWords(25)}
          >
            25
          </button>

          <button
            className={mode === "words" && words === 50 ? active : inactive}
            onClick={() => setWords(50)}
          >
            50
          </button>

          <button
            className={mode === "words" && words === 100 ? active : inactive}
            onClick={() => setWords(100)}
          >
            100
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolKit;
