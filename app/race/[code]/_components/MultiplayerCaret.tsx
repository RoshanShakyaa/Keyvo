"use client";
import { motion } from "motion/react";

type CaretProps = {
  color: string;
  offsetY?: number;
};

export function Caret({ color, offsetY = 0 }: CaretProps) {
  return (
    <motion.div
      className="absolute w-0.5 h-7 pointer-events-none"
      style={{
        backgroundColor: color,
        transform: `translateY(${offsetY}px)`,
      }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{
        opacity: { repeat: Infinity, duration: 0.8, ease: "easeInOut" },
      }}
    />
  );
}
