"use client";

import { useTestEngine } from "@/hooks/useTestEngine";
import { useEffect, useRef, useState } from "react";
import { Results } from "./Result";
import Caret from "./Caret";
import { getRandomWords } from "@/lib/words";
import { RotateCw } from "lucide-react";
import ToolKit from "./ToolKit";
import KeyboardUI from "@/components/KeyboardUI";

const TypingTest = () => {
  const [words, setWords] = useState(() => getRandomWords(15));

  const { text, typing, timer, reset, results } = useTestEngine(words, 30);

  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const restartButtonRef = useRef<HTMLButtonElement>(null);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });

  const handleRestart = () => {
    setWords(getRandomWords(15));
    reset();
  };

  useEffect(() => {
    const currentChar = charRefs.current[typing.caret];

    if (currentChar && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();

      setCaretPos({
        top: charRect.top - containerRect.top,
        left: charRect.left - containerRect.left,
      });
    }
  }, [typing.caret]);

  // Handle Tab and Enter keys with capture phase (runs before typing engine)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        restartButtonRef.current?.focus();
        return;
      }

      // If Enter is pressed and button is focused, restart
      if (
        e.key === "Enter" &&
        document.activeElement === restartButtonRef.current
      ) {
        e.preventDefault();
        e.stopPropagation();
        restartButtonRef.current?.blur(); // Remove focus before restart
        handleRestart();
        return;
      }
    };

    // Use capture phase to intercept before typing engine
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleRestart]);

  if (results) {
    return (
      <div className="flex-1 bg-red-300 flex items-center">
        <Results
          wpm={results.wpm}
          accuracy={results.accuracy}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col  flex-1">
      <ToolKit />

      <div className="mt-30">
        {/* Timer */}
        <div className=" mb-4">
          <div className="text-xl ">{timer.timeLeft}</div>
        </div>

        {/* Typing Area */}
        <div
          ref={containerRef}
          className="relative   rounded-lg text-2xl leading-relaxed font-mono select-none"
          style={{ minHeight: "200px" }}
        >
          <Caret top={caretPos.top} left={caretPos.left} />

          <div className="relative">
            {text.split("").map((char, i) => {
              const typed = typing.typedChars[i];
              let color = "text-gray-500";

              if (typed) {
                color = typed.correct ? "text-black" : "text-red-500";
              }

              return (
                <span
                  key={i}
                  ref={(el) => {
                    charRefs.current[i] = el;
                  }}
                  className={`${color} transition-colors`}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>

        {/* Restart Button */}
        <div className="text-center mt-8">
          <button
            ref={restartButtonRef}
            onClick={handleRestart}
            className="px-4 py-2 rounded cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <RotateCw className="size-6" />
          </button>
        </div>
        <KeyboardUI />
      </div>
    </div>
  );
};

export default TypingTest;
