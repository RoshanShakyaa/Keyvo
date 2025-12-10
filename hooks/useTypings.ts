"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const isKeyboardCodeAllowed = (code: string) => {
  return (
    code.startsWith("Key") ||
    code.startsWith("Digit") ||
    code === "Backspace" ||
    code === "Space"
  );
};

const useTypings = (enabled: boolean) => {
  const [cursor, setCursor] = useState(0);
  const [typed, setTyped] = useState<string>("");
  const [totalTyped, setTotalTyped] = useState(0);

  const keydownHandler = useCallback(
    ({ key, code }: KeyboardEvent) => {
      if (!enabled || !isKeyboardCodeAllowed(code)) {
        return;
      }

      switch (key) {
        case "Backspace":
          setTyped((prev) => prev.slice(0, -1));
          setCursor((prev) => prev - 1);
          setTotalTyped((prev) => prev - 1);
          break;
        default:
          setTyped((prev) => prev.concat(key));
          setCursor((prev) => prev + 1);
          setTotalTyped((prev) => prev + 1);
      }
    },
    [enabled]
  );

  const clearTyped = useCallback(() => {
    setTyped("");
    setCursor(0);
  }, []);

  const resetTotalTyped = useCallback(() => {
    setTotalTyped(0);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", keydownHandler);

    return () => {
      window.removeEventListener("keydown", keydownHandler);
    };
  }, [keydownHandler]);

  return {
    typed,
    cursor,
    clearTyped,
    resetTotalTyped,
    totalTyped,
  };
};

export default useTypings;
