"use client";

import { useCallback, useEffect, useRef, useState } from "react";
type TypedChar = {
  char: string;
  expected: string | null;
  correct: boolean | null;
  timestamp: number;
};

export function useTypingEngine(text: string, onStart: () => void) {
  const [typedChars, setTypedChars] = useState<TypedChar[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const hasStartedRef = useRef(false);
  const onCompleteRef = useRef<(() => void) | null>(null);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (isFinished) return;

      // Allow Ctrl+R for refresh
      if (e.ctrlKey && e.key === "r") return;

      if (e.key === "Enter" && document.activeElement?.tagName === "BUTTON") {
        return;
      }
      if (e.metaKey || e.altKey) return;

      const key = e.key;

      // Start timer on first keypress
      if (!hasStartedRef.current && key.length === 1) {
        hasStartedRef.current = true;
        onStart();
      }

      // Backspace
      if (key === "Backspace") {
        e.preventDefault();

        // Ctrl + Backspace: delete entire word
        if (e.ctrlKey) {
          setTypedChars((prev) => {
            let i = prev.length - 1;

            // Skip trailing spaces
            while (i >= 0 && prev[i].char === " ") i--;

            // Delete until we hit a space or the beginning
            while (i >= 0 && prev[i].char !== " ") i--;

            return prev.slice(0, i + 1);
          });
          return;
        }

        // Regular backspace: delete one character
        setTypedChars((prev) => prev.slice(0, -1));
        return;
      }

      // Normal characters
      // Normal characters
      if (key.length === 1) {
        e.preventDefault();
        setTypedChars((prev) => {
          const idx = prev.length;
          const expected = text[idx] ?? null;
          const correct = expected !== null ? key === expected : false;

          const newChars = [
            ...prev,
            {
              char: key,
              expected,
              correct,
              timestamp: Date.now(),
            },
          ];

          // If user pressed space, skip to the next word
          if (key === " " && expected !== " ") {
            // Find the next space or end of text
            let nextSpaceIndex = idx;
            while (
              nextSpaceIndex < text.length &&
              text[nextSpaceIndex] !== " "
            ) {
              nextSpaceIndex++;
            }

            // Fill in the skipped characters as incorrect
            const skippedChars = [];
            for (let i = idx; i < nextSpaceIndex; i++) {
              skippedChars.push({
                char: text[i],
                expected: text[i],
                correct: false,
                timestamp: Date.now(),
              });
            }

            // Add the space
            skippedChars.push({
              char: " ",
              expected: text[nextSpaceIndex] ?? null,
              correct: text[nextSpaceIndex] === " ",
              timestamp: Date.now(),
            });

            const finalChars = [...prev, ...skippedChars];

            // Check if user has completed all text
            if (finalChars.length >= text.length && onCompleteRef.current) {
              setTimeout(() => onCompleteRef.current?.(), 0);
            }

            return finalChars;
          }

          // Check if user has completed all text
          if (newChars.length === text.length && onCompleteRef.current) {
            setTimeout(() => onCompleteRef.current?.(), 0);
          }

          return newChars;
        });
      }
    },
    [text, onStart, isFinished]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const clear = useCallback(() => {
    setTypedChars([]);
    setIsFinished(false);
    hasStartedRef.current = false;
  }, []); // Empty dependency array since we're just resetting state
  const finish = useCallback(() => {
    setIsFinished(true);
  }, []);

  const setOnComplete = useCallback((callback: () => void) => {
    onCompleteRef.current = callback;
  }, []);

  const caret = typedChars.length;
  const rawChars = typedChars.length;
  const correctChars = typedChars.filter((c) => c.correct).length;

  return {
    typedChars,
    caret,
    rawChars,
    correctChars,
    isFinished,
    clear,
    finish,
    setOnComplete,
  };
}
