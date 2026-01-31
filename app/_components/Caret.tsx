"use client";
import { motion } from "motion/react";

const Caret = ({ top, left }: { top: number; left: number }) => {
  return (
    <motion.div
      className="absolute w-0.5 h-7 bg-yellow-400 pointer-events-none"
      style={{ top: 0, left: 0 }} // Keep position origin at 0,0
      animate={{
        opacity: [1, 0, 1],
        x: left,
        y: top,
      }}
      transition={{
        opacity: {
          repeat: Infinity,
          duration: 0.8,
          ease: "easeInOut",
        },
        x: { duration: 0.15, ease: "easeOut" },
        y: { duration: 0.15, ease: "easeOut" },
      }}
    />
  );
};

export default Caret;
