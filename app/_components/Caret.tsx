"use client";
import { motion } from "motion/react";

const Caret = ({ top, left }: { top: number; left: number }) => {
  return (
    <motion.div
      className="absolute w-0.5 h-7 bg-yellow-400 pointer-events-none"
      animate={{
        opacity: [1, 0, 1],
        top,
        left,
      }}
      transition={{
        opacity: { repeat: Infinity, duration: 0.8, ease: "easeInOut" },
        top: { duration: 0.15, ease: "easeOut" },
        left: { duration: 0.15, ease: "easeOut" },
      }}
    />
  );
};
export default Caret;
