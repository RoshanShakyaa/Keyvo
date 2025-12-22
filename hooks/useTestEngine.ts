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
    (
      typedChars: typeof typing.typedChars,
      testStartTime: number
    ): ChartDataPoint[] => {
      if (typedChars.length === 0) return [];

      const data: ChartDataPoint[] = [];

      // Calculate data for each second that has elapsed
      const lastCharTime = typedChars[typedChars.length - 1].timestamp;
      const totalElapsedSeconds = Math.ceil(
        (lastCharTime - testStartTime) / 1000
      );

      for (let second = 1; second <= totalElapsedSeconds; second++) {
        const timeThreshold = testStartTime + second * 1000;
        const charsAtTime = typedChars.filter(
          (c) => c.timestamp <= timeThreshold
        );

        if (charsAtTime.length === 0) {
          data.push({ time: second, wpm: 0, raw: 0, errors: 0 });
          continue;
        }

        const correctCharsAtTime = charsAtTime.filter((c) => c.correct).length;
        const errorCharsAtTime = charsAtTime.filter((c) => !c.correct).length;

        // Calculate WPM based on time elapsed so far
        const wpm = Math.round(correctCharsAtTime / 5 / (second / 60));
        const raw = Math.round(charsAtTime.length / 5 / (second / 60));

        data.push({
          time: second,
          wpm,
          raw,
          errors: errorCharsAtTime,
        });
      }

      return data;
    },
    []
  );

  const results = useMemo(() => {
    if (!typing.isFinished) return null;

    const { rawChars, correctChars, typedChars } = typing;

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

    // Calculate actual time spent typing (start to last keystroke)
    const testStartTime = typedChars[0].timestamp;
    const testEndTime = typedChars[typedChars.length - 1].timestamp;
    const elapsedSeconds = (testEndTime - testStartTime) / 1000;

    // If timer ran out, use the full duration
    // If finished early, use actual elapsed time
    const timeToUse = timer.timeLeft === 0 ? durationSeconds : elapsedSeconds;

    // Monkeytype formula: (chars / 5) / (seconds / 60)
    const wpm = Math.round(correctChars / 5 / (timeToUse / 60));
    const rawWpm = Math.round(rawChars / 5 / (timeToUse / 60));

    // Accuracy = (correctChars / rawChars) * 100
    const accuracy =
      rawChars === 0 ? 0 : Math.round((correctChars / rawChars) * 100);

    const errors = rawChars - correctChars;

    const chartData = calculateChartData(typedChars, testStartTime);

    return {
      wpm,
      rawWpm,
      accuracy,
      rawChars,
      correctChars,
      errors,
      chartData,
    };
  }, [typing, durationSeconds, timer.timeLeft, calculateChartData]);

  return {
    text,
    typing,
    timer,
    reset,
    results,
  };
}
