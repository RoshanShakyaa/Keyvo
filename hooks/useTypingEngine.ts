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
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalKeysPressed, setTotalKeysPressed] = useState(0);

  const hasStartedRef = useRef(false);
  const onCompleteRef = useRef<(() => void) | null>(null);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (isFinished) return;
      if (e.ctrlKey && e.key === "r") return;
      if (e.key === "Enter" && document.activeElement?.tagName === "BUTTON")
        return;
      if (e.metaKey || e.altKey) return;

      const key = e.key;

      // Start the engine on first valid keypress
      if (!hasStartedRef.current && key.length === 1) {
        hasStartedRef.current = true;
        onStart();
      }

      // Handle Backspace
      if (key === "Backspace") {
        e.preventDefault();
        if (e.ctrlKey) {
          setTypedChars((prev) => {
            let i = prev.length - 1;
            while (i >= 0 && prev[i].char === " ") i--;
            while (i >= 0 && prev[i].char !== " ") i--;
            return prev.slice(0, i + 1);
          });
          return;
        }
        setTypedChars((prev) => prev.slice(0, -1));
        return;
      }

      // Handle Character Input
      if (key.length === 1) {
        e.preventDefault();

        // Calculate current position based on the length of typedChars
        // We use the current state value directly here
        const idx = typedChars.length;
        if (idx >= text.length) return;

        const expected = text[idx] ?? null;
        const isCorrect = expected !== null ? key === expected : false;

        // --- CASE 1: Word Skip (Space pressed mid-word) ---
        if (key === " " && expected !== " " && expected !== null) {
          let nextSpaceIndex = idx;
          while (nextSpaceIndex < text.length && text[nextSpaceIndex] !== " ") {
            nextSpaceIndex++;
          }

          const charsToSkip = nextSpaceIndex - idx;
          const newErrors = 1 + charsToSkip; // The wrong space + the skipped letters
          const newKeys = 1 + charsToSkip;

          // Update global counters (Safely outside the state setter)
          setTotalErrors((prev) => prev + newErrors);
          setTotalKeysPressed((prev) => prev + newKeys);

          const skippedEntries: TypedChar[] = [];
          for (let i = idx; i < nextSpaceIndex; i++) {
            skippedEntries.push({
              char: text[i],
              expected: text[i],
              correct: false,
              timestamp: Date.now(),
            });
          }

          // Add the trailing space as a correct character if it exists
          if (nextSpaceIndex < text.length) {
            skippedEntries.push({
              char: " ",
              expected: " ",
              correct: true,
              timestamp: Date.now(),
            });
          }

          setTypedChars((prev) => {
            const updated = [...prev, ...skippedEntries];
            if (updated.length >= text.length && onCompleteRef.current) {
              setTimeout(() => onCompleteRef.current?.(), 0);
            }
            return updated;
          });
          return;
        }

        // --- CASE 2: Normal Keypress ---
        setTotalKeysPressed((prev) => prev + 1);
        if (!isCorrect) {
          setTotalErrors((prev) => prev + 1);
        }

        setTypedChars((prev) => {
          const updated = [
            ...prev,
            {
              char: key,
              expected,
              correct: isCorrect,
              timestamp: Date.now(),
            },
          ];

          if (updated.length >= text.length && onCompleteRef.current) {
            setTimeout(() => onCompleteRef.current?.(), 0);
          }
          return updated;
        });
      }
    },
    [text, onStart, isFinished, typedChars.length], // Added typedChars.length to deps for accuracy
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const clear = useCallback(() => {
    setTypedChars([]);
    setIsFinished(false);
    setTotalErrors(0);
    setTotalKeysPressed(0);
    hasStartedRef.current = false;
  }, []);

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
    totalErrors,
    totalKeysPressed,
    isFinished,
    clear,
    finish,
    setOnComplete,
  };
}
