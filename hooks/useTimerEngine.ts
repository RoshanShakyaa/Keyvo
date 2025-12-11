import { useCallback, useEffect, useRef, useState } from "react";

export function useTimerEngine(durationMs: number, enabled: boolean) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!enabled || isRunning) return;

    const now = Date.now();
    startRef.current = now;
    setElapsedMs(0);
    setIsRunning(true);
  }, [enabled, isRunning]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    startRef.current = null;
    setElapsedMs(0);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!isRunning || !startRef.current) return;

    const id = window.setInterval(() => {
      const ms = Date.now() - startRef.current!;
      setElapsedMs(ms);

      if (ms >= durationMs) {
        setIsRunning(false);
      }
    }, 100);

    return () => window.clearInterval(id);
  }, [isRunning, durationMs]);

  return { elapsedMs, isRunning, start, stop, reset };
}
