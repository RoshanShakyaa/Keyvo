import { RotateCw } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

export const Results = ({
  wpm,
  accuracy,
  onRestart,
}: {
  wpm: number;
  accuracy: number;
  onRestart: () => void;
}) => {
  const restartButtonRef = useRef<HTMLButtonElement>(null);

  // Handle Tab and Enter keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        restartButtonRef.current?.focus();
        return;
      }

      if (
        e.key === "Enter" &&
        document.activeElement === restartButtonRef.current
      ) {
        e.preventDefault();
        e.stopPropagation();
        restartButtonRef.current?.blur();
        onRestart();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onRestart]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center w-full gap-6 p-8"
    >
      <h2 className="text-3xl font-bold text-primary">Test Complete!</h2>
      <div className="flex gap-12">
        <div className="text-center">
          <div className="text-5xl font-bold text-foreground">{wpm}</div>
          <div className="text-muted-foreground text-2xl mt-2">WPM</div>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold text-foreground">{accuracy}%</div>
          <div className="text-muted-foreground text-2xl mt-2">Accuracy</div>
        </div>
      </div>
      <button
        ref={restartButtonRef}
        onClick={onRestart}
        className="px-6 py-3 text-muted-foreground hover:text-primary font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <RotateCw />
      </button>
    </motion.div>
  );
};
