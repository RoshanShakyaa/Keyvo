"use client";

import { useKeyboardUIStore, useToolkitStore } from "@/lib/store";
import { Keyboard } from "lucide-react";

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
  const active = "font-semibold text-black cursor-pointer";
  const inactive = "font-normal text-gray-500 cursor-pointer";
  return (
    <div className="flex items-center gap-6 justify-center bg-gray-200 py-2 px-6 rounded-md w-fit mx-auto">
      <button onClick={toggleKeyboard}>
        <Keyboard />
      </button>

      <button
        className={`cursor-pointer ${punctuation && "font-semibold"}`}
        onClick={togglePunctuation}
      >
        punctuation
      </button>

      <button
        className={`cursor-pointer ${number && "font-semibold"}`}
        onClick={toggleNumber}
      >
        numbers
      </button>

      <span>|</span>
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
      <span>|</span>
      <button
        className={words === 10 ? active : inactive}
        onClick={() => setWords(10)}
      >
        10
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
