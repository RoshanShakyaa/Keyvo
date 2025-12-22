"use client";

import { useTestEngine } from "@/hooks/useTestEngine";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Results } from "./Result";
import Caret from "./Caret";
import { getRandomWords } from "@/lib/words";
import { RotateCw } from "lucide-react";
import ToolKit from "./ToolKit";
import KeyboardUI from "@/components/KeyboardUI";
import { useToolkitStore } from "@/lib/store";

const TypingTestCore = ({
  time,
  words,
  onRegenerate,
}: {
  time: number;
  wordCount: number;
  words: string[];
  onRegenerate: () => void;
}) => {
  const { text, typing, timer, reset, results } = useTestEngine(words, time);

  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const restartButtonRef = useRef<HTMLButtonElement>(null);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });

  const handleRestart = useCallback(() => {
    onRegenerate(); // This will trigger new words in parent
    reset();
  }, [reset, onRegenerate]);

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
        restartButtonRef.current?.blur();
        handleRestart();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleRestart]);

  if (results) {
    return (
      <div className="flex-1 flex items-center">
        <Results
          wpm={results.wpm}
          rawWpm={results.rawWpm}
          accuracy={results.accuracy}
          errors={results.errors}
          chartData={results.chartData}
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
                color = typed.correct ? "text-primary" : "text-red-500";
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

const TypingTest = () => {
  const { time, words: wordCount, punctuation, number } = useToolkitStore();

  // Use state to force regeneration
  const [wordsKey, setWordsKey] = useState(0);

  // Generate words when settings or key changes
  const words = useMemo(() => {
    console.log(
      "Generating new words:",
      wordCount,
      "punctuation:",
      punctuation,
      "numbers:",
      number
    );
    return getRandomWords(wordCount, { punctuation, numbers: number });
  }, [wordCount, punctuation, number, wordsKey]);

  // Callback to regenerate words
  const regenerateWords = useCallback(() => {
    setWordsKey((prev) => prev + 1);
  }, []);

  // Remount only when time changes (keeps same words)
  const testKey = `${time}`;

  return (
    <TypingTestCore
      key={testKey}
      time={time}
      wordCount={wordCount}
      words={words}
      onRegenerate={regenerateWords}
    />
  );
};
export default TypingTest;
