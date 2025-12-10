"use client";
interface ResultProps {
  errors: number;
  accuracyPercentage: number;
  total: number;
  className?: string;
  state: State;
}
import { State } from "@/hooks/useEngine";
import { motion } from "motion/react";

const Result = ({
  state,
  errors,
  accuracyPercentage,
  total,
  className,
}: ResultProps) => {
  const initial = { opacity: 0 };
  const animate = { opacity: 1 };
  const duration = { duration: 0.3 };

  if (state !== "finish") {
    return null;
  }

  return (
    <ul
      className={`flex flex-col items-center text-blue-400 space-y-3 mt-20 ${className}`}
    >
      <motion.li
        initial={initial}
        animate={animate}
        transition={{ ...duration, delay: 0 }}
        className="text-xl font-semibold"
      >
        Results
      </motion.li>
      <motion.li
        initial={initial}
        animate={animate}
        transition={{ ...duration, delay: 0.5 }}
      >
        Accuracy: {accuracyPercentage}
      </motion.li>
      <motion.li
        className="text-red-500"
        initial={initial}
        animate={animate}
        transition={{ ...duration, delay: 1 }}
      >
        Errors: {errors}
      </motion.li>
      <motion.li
        initial={initial}
        animate={animate}
        transition={{ ...duration, delay: 1.4 }}
      >
        Typed: {total}
      </motion.li>
    </ul>
  );
};

export default Result;
