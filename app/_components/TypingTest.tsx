"use client";

import { useTestEngine } from "@/hooks/useTestEngine";
import { useEffect, useRef, useState } from "react";
import { Results } from "./Result";
import Caret from "./Caret";
import { getRandomWords } from "@/lib/words";

const TypingTest = () => {
  // Generate words once during initialization
  const [words] = useState(() => getRandomWords(50));

  const { text, typing, timer, reset, results } = useTestEngine(words, 30);

  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });

  // Update caret position
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

  if (results) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Results
          wpm={results.wpm}
          accuracy={results.accuracy}
          onRestart={reset}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Timer */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-yellow-400">
            {timer.timeLeft}
          </div>
          <div className="text-gray-400 mt-2">seconds remaining</div>
        </div>

        {/* Typing Area */}
        <div
          ref={containerRef}
          className="relative bg-gray-800 p-8 rounded-lg text-2xl leading-relaxed font-mono select-none"
          style={{ minHeight: "200px" }}
        >
          <Caret top={caretPos.top} left={caretPos.left} />

          <div className="relative">
            {text.split("").map((char, i) => {
              const typed = typing.typedChars[i];
              let color = "text-gray-500";

              if (typed) {
                color = typed.correct ? "text-white" : "text-red-500";
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

        {/* Instructions */}
        <div className="text-center mt-6 text-gray-400">
          {!timer.isRunning ? (
            <p>Start typing to begin the test</p>
          ) : (
            <p>Keep typing! Time is running out.</p>
          )}
        </div>

        {/* Restart Button */}
        <div className="text-center mt-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Restart (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypingTest;
