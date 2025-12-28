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
import { saveTestResult } from "../actions/test-results";

const TypingTestCore = ({
  time,
  words,
  mode,
  onRegenerate,
}: {
  time: number;
  wordCount: number;
  words: string[];
  mode: "time" | "words";
  onRegenerate: () => void;
}) => {
  const { text, typing, timer, reset, results } = useTestEngine(
    words,
    time,
    mode
  );

  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textWrapperRef = useRef<HTMLDivElement>(null);
  const restartButtonRef = useRef<HTMLButtonElement>(null);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);

  const handleRestart = useCallback(() => {
    onRegenerate();
    reset();
    setScrollOffset(0);
  }, [reset, onRegenerate]);

  useEffect(() => {
    if (results) {
      // Auto-save results when test finishes
      const totalChars =
        results.chartData.length > 0
          ? Math.round(results.chartData[results.chartData.length - 1].raw * 5)
          : 0;

      saveTestResult({
        wpm: results.wpm,
        rawWpm: results.rawWpm,
        accuracy: results.accuracy,
        consistency: results.consistency,
        characters: totalChars,
        errors: results.errors,
        mode,
        duration: time,
        chartData: results.chartData,
      }).catch((err) => {
        console.error("Failed to save result:", err);
        // Silent fail - don't interrupt user experience
      });
    }
  }, [results, mode, time]);
  useEffect(() => {
    const currentChar = charRefs.current[typing.caret];

    if (currentChar && containerRef.current && textWrapperRef.current) {
      // Get positions relative to the wrapper (not container)
      const wrapperRect = textWrapperRef.current.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // Calculate position within the scrollable content
      const absoluteTop = charRect.top - wrapperRect.top;
      const relativeLeft = charRect.left - containerRect.left;

      // Line height = text-2xl (1.5rem = 24px) × leading-relaxed (1.625) = ~39px
      const lineHeight = 39;
      const currentLine = Math.floor(absoluteTop / lineHeight);

      // Calculate scroll offset to keep current line at line 1 (second visible line)
      // When you reach line 2 or beyond, start scrolling
      if (currentLine >= 2) {
        const newOffset = (currentLine - 1) * lineHeight;
        setScrollOffset(newOffset);
      }

      // Set caret position relative to visible area (accounting for scroll)
      setCaretPos({
        top: absoluteTop - scrollOffset,
        left: relativeLeft,
      });
    }
  }, [typing.caret, scrollOffset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        restartButtonRef.current?.focus();
        return;
      }

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
          consistency={results.consistency}
          errors={results.errors}
          chartData={results.chartData}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col flex-1">
      <ToolKit />

      <div className="mt-30">
        {mode === "time" && (
          <div className="mb-4">
            <div className="text-xl">{timer.timeLeft}</div>
          </div>
        )}

        {/* Typing Area */}
        <div
          ref={containerRef}
          className="relative rounded-lg text-2xl leading-relaxed font-mono select-none overflow-hidden"
          style={{
            height: "117px", // 3 lines × 39px
          }}
        >
          <Caret top={caretPos.top} left={caretPos.left} />

          <div
            ref={textWrapperRef}
            className="relative transition-transform duration-150 ease-out"
            style={{
              transform: `translateY(-${scrollOffset}px)`,
            }}
          >
            {text.split("").map((char, i) => {
              const typed = typing.typedChars[i];
              let color = "text-gray-500";

              if (typed) {
                color = typed.correct ? "text-primary" : "text-red-900";
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
  const {
    time,
    words: wordCount,
    punctuation,
    number,
    mode,
  } = useToolkitStore();

  const [wordsKey, setWordsKey] = useState(0);

  // Generate different amount of words based on mode
  const words = useMemo(() => {
    console.log("Generating new words for mode:", mode);
    if (mode === "time") {
      // Generate lots of words for time mode (e.g., 200 words for long tests)
      return getRandomWords(200, { punctuation, numbers: number });
    } else {
      // Generate exact word count for words mode
      return getRandomWords(wordCount, { punctuation, numbers: number });
    }
  }, [mode, wordCount, punctuation, number, wordsKey]);

  const regenerateWords = useCallback(() => {
    setWordsKey((prev) => prev + 1);
  }, []);

  // Use mode in key to remount when switching modes
  const testKey = `${mode}-${mode === "time" ? time : wordCount}`;

  return (
    <TypingTestCore
      key={testKey}
      time={time}
      wordCount={wordCount}
      words={words}
      mode={mode}
      onRegenerate={regenerateWords}
    />
  );
};

export default TypingTest;
