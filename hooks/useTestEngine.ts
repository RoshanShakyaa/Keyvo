import { useCallback, useEffect, useMemo } from "react";
import { useTypingEngine } from "./useTypingEngine";
import useCountdownTimer from "./useCountdownTimer";

type ChartDataPoint = {
  time: number;
  wpm: number;
  raw: number;
  errors: number;
  accuracy: number;
};

export function useTestEngine(
  words: string[],
  durationSeconds: number,
  mode: "time" | "words",
) {
  const text = useMemo(() => words.join(" "), [words]);
  const timer = useCountdownTimer(durationSeconds);
  const typing = useTypingEngine(text, timer.start);

  function calculateConsistency(chartData: ChartDataPoint[]): number {
    if (chartData.length < 2) return 100;

    const wpms = chartData.map((d) => d.wpm);
    const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    const variance =
      wpms.reduce((sum, wpm) => sum + Math.pow(wpm - avg, 2), 0) / wpms.length;
    const stdDev = Math.sqrt(variance);

    const consistency = Math.max(0, 100 - (stdDev / avg) * 100);
    return Math.round(consistency);
  }

  // Set up completion callback
  useEffect(() => {
    typing.setOnComplete(() => {
      timer.stop();
      typing.finish();
    });
  }, [typing, timer]);

  // Auto-finish when timer reaches 0 (ONLY in time mode)
  useEffect(() => {
    if (mode === "time" && timer.timeLeft === 0 && !typing.isFinished) {
      typing.finish();
    }
  }, [timer.timeLeft, typing.isFinished, typing, mode]);

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
      testStartTime: number,
    ): ChartDataPoint[] => {
      if (typedChars.length === 0) return [];

      const data: ChartDataPoint[] = [];

      // Calculate data for each second that has elapsed
      const lastCharTime = typedChars[typedChars.length - 1].timestamp;
      const totalElapsedSeconds = Math.ceil(
        (lastCharTime - testStartTime) / 1000,
      );

      for (let second = 1; second <= totalElapsedSeconds; second++) {
        const timeThreshold = testStartTime + second * 1000;
        const charsAtTime = typedChars.filter(
          (c) => c.timestamp <= timeThreshold,
        );

        if (charsAtTime.length === 0) {
          data.push({ time: second, wpm: 0, raw: 0, errors: 0, accuracy: 100 });
          continue;
        }

        const correctCharsAtTime = charsAtTime.filter((c) => c.correct).length;
        const errorCharsAtTime = charsAtTime.filter((c) => !c.correct).length;

        // WPM = (correct characters / 5) / (time in minutes)
        // This gives us words per minute based on correct characters only
        const wpm = Math.round(correctCharsAtTime / 5 / (second / 60));

        // Raw WPM = (all characters / 5) / (time in minutes)
        const raw = Math.round(charsAtTime.length / 5 / (second / 60));

        // Accuracy at this point in time
        const accuracy = Math.round(
          (correctCharsAtTime / charsAtTime.length) * 100,
        );

        data.push({
          time: second,
          wpm,
          raw,
          errors: errorCharsAtTime,
          accuracy,
        });
      }

      return data;
    },
    [],
  );

  const results = useMemo(() => {
    if (!typing.isFinished) return null;

    const {
      rawChars,
      correctChars,
      typedChars,
      totalErrors,
      totalKeysPressed,
    } = typing;

    if (typedChars.length === 0) {
      return {
        wpm: 0,
        rawWpm: 0,
        accuracy: 0,
        consistency: 0,
        rawChars: 0,
        correctChars: 0,
        errors: 0,
        totalErrors: 0,
        totalKeysPressed: 0,
        chartData: [],
      };
    }

    // Calculate actual elapsed time
    const testStartTime = typedChars[0].timestamp;
    const testEndTime = typedChars[typedChars.length - 1].timestamp;
    const actualElapsedSeconds = (testEndTime - testStartTime) / 1000;

    // Use actual elapsed time OR the full duration (whichever is appropriate)
    let timeToUse: number;

    if (mode === "time") {
      // In time mode, use the full duration
      timeToUse = durationSeconds;
    } else {
      // In words mode, use actual elapsed time
      timeToUse = actualElapsedSeconds;
    }

    // Standard WPM formula: (correct characters / 5) / (time in minutes)
    const wpm = Math.round(correctChars / 5 / (timeToUse / 60));

    // Raw WPM: (all typed characters / 5) / (time in minutes)
    const rawWpm = Math.round(rawChars / 5 / (timeToUse / 60));

    // Accuracy based on FINAL state (what's currently on screen)
    const finalAccuracy =
      rawChars === 0 ? 0 : Math.round((correctChars / rawChars) * 100);

    // Overall accuracy based on ALL keypresses (including corrected errors)
    const overallAccuracy =
      totalKeysPressed === 0
        ? 100
        : Math.round(
            ((totalKeysPressed - totalErrors) / totalKeysPressed) * 100,
          );

    const chartData = calculateChartData(typedChars, testStartTime);
    const consistency = calculateConsistency(chartData);

    return {
      wpm,
      rawWpm,
      accuracy: overallAccuracy, // Use overall accuracy (includes corrected errors)
      consistency,
      rawChars,
      correctChars,
      errors: totalErrors, // Total errors including corrected ones
      totalErrors,
      totalKeysPressed,
      finalAccuracy, // What's visible on screen
      chartData,
    };
  }, [typing, durationSeconds, mode, calculateChartData]);

  return {
    text,
    typing,
    timer,
    reset,
    results,
  };
}
