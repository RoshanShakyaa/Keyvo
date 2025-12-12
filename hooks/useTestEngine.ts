import { useCallback, useEffect, useMemo } from "react";
import { useTypingEngine } from "./useTypingEngine";
import useCountdownTimer from "./useCountdownTimer";

export function useTestEngine(words: string[], durationSeconds: number) {
  const text = useMemo(() => words.join(" "), [words]);
  const timer = useCountdownTimer(durationSeconds);
  const typing = useTypingEngine(text, timer.start);

  // Set up completion callback
  useEffect(() => {
    typing.setOnComplete(() => {
      timer.stop();
      typing.finish();
    });
  }, [typing, timer]);

  // Auto-finish when timer reaches 0
  useEffect(() => {
    if (timer.timeLeft === 0 && !typing.isFinished) {
      typing.finish();
    }
  }, [timer.timeLeft, typing.isFinished, typing]);

  const reset = useCallback(() => {
    console.log("Reset called!", typing, timer);
    typing.clear();
    timer.reset();
  }, [typing, timer]);

  const results = useMemo(() => {
    if (!typing.isFinished) return null;

    const { rawChars, correctChars } = typing;
    const minutes = durationSeconds / 60;
    const wpm = correctChars === 0 ? 0 : Math.round(correctChars / 5 / minutes);
    const accuracy =
      rawChars === 0 ? 0 : Math.round((correctChars / rawChars) * 100);

    return { wpm, accuracy, rawChars, correctChars };
  }, [typing, durationSeconds]);

  return {
    text,
    typing,
    timer,
    reset,
    results,
  };
}
