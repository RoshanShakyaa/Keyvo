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

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (isFinished) return;
      if (e.metaKey || e.altKey || e.ctrlKey) return;

      const key = e.key;

      // Start timer on first keypress
      if (!hasStartedRef.current && key.length === 1) {
        hasStartedRef.current = true;
        onStart();
      }

      // Backspace
      if (key === "Backspace") {
        e.preventDefault();
        setTypedChars((prev) => prev.slice(0, -1));
        return;
      }

      // Normal characters
      if (key.length === 1) {
        e.preventDefault();
        setTypedChars((prev) => {
          const idx = prev.length;
          const expected = text[idx] ?? null;
          const correct = expected !== null ? key === expected : false;

          return [
            ...prev,
            {
              char: key,
              expected,
              correct,
              timestamp: Date.now(),
            },
          ];
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
  }, []);

  const finish = useCallback(() => {
    setIsFinished(true);
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
  };
}
