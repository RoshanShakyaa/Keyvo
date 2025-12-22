import { useCallback, useEffect, useMemo } from "react";
import { useTypingEngine } from "./useTypingEngine";
import useCountdownTimer from "./useCountdownTimer";

type ChartDataPoint = {
  time: number;
  wpm: number;
  raw: number;
  errors: number;
};

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

  // Reset typing when text changes (new words)
  useEffect(() => {
    typing.clear();
  }, [text, typing.clear]);

  const reset = useCallback(() => {
    console.log("Reset called!", typing, timer);
    typing.clear();
    timer.reset();
  }, [typing, timer]);

  // Helper function to calculate chart data
  const calculateChartData = useCallback(
    (typedChars: typeof typing.typedChars): ChartDataPoint[] => {
      if (typedChars.length === 0) return [];

      const startTime = typedChars[0].timestamp;
      const endTime = typedChars[typedChars.length - 1].timestamp;
      const data: ChartDataPoint[] = [];

      const totalSeconds = Math.ceil((endTime - startTime) / 1000);

      for (let second = 1; second <= totalSeconds; second++) {
        const timeThreshold = startTime + second * 1000;
        const charsAtTime = typedChars.filter(
          (c) => c.timestamp <= timeThreshold
        );

        if (charsAtTime.length === 0) continue;

        const correctChars = charsAtTime.filter((c) => c.correct).length;
        const errorChars = charsAtTime.filter((c) => !c.correct).length;

        const minutes = second / 60;
        const wpm = Math.round(correctChars / 5 / minutes);
        const raw = Math.round(charsAtTime.length / 5 / minutes);

        data.push({
          time: second,
          wpm,
          raw,
          errors: errorChars,
        });
      }

      return data;
    },
    []
  );

  const results = useMemo(() => {
    if (!typing.isFinished) return null;

    const { rawChars, correctChars, typedChars } = typing;

    // Calculate actual elapsed time in minutes
    if (typedChars.length === 0) {
      return {
        wpm: 0,
        rawWpm: 0,
        accuracy: 0,
        rawChars: 0,
        correctChars: 0,
        errors: 0,
        chartData: [],
      };
    }

    const startTime = typedChars[0].timestamp;
    const endTime = typedChars[typedChars.length - 1].timestamp;
    const elapsedMinutes = (endTime - startTime) / 1000 / 60;

    // WPM = (correct characters / 5) / minutes
    const wpm =
      elapsedMinutes > 0 ? Math.round(correctChars / 5 / elapsedMinutes) : 0;

    // Raw WPM = (all characters / 5) / minutes
    const rawWpm =
      elapsedMinutes > 0 ? Math.round(rawChars / 5 / elapsedMinutes) : 0;

    const accuracy =
      rawChars === 0 ? 0 : Math.round((correctChars / rawChars) * 100);
    const errors = rawChars - correctChars;

    const chartData = calculateChartData(typedChars);

    return {
      wpm,
      rawWpm,
      accuracy,
      rawChars,
      correctChars,
      errors,
      chartData,
    };
  }, [typing, calculateChartData]);

  return {
    text,
    typing,
    timer,
    reset,
    results,
  };
}
