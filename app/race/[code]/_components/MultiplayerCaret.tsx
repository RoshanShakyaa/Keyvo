"use client";
import { motion } from "motion/react";
import { memo } from "react";

type CaretProps = {
  color: string;
  top?: number;
  left?: number;
  offsetY?: number;
  isMultiplayer?: boolean;
};

export const Caret = memo(
  ({ color, top = 0, left = 0, offsetY = 0, isMultiplayer }: CaretProps) => {
    return (
      <motion.div
        className="absolute w-0.5 h-7 pointer-events-none"
        style={{
          top: 0,
          left: 0,
          backgroundColor: color,
        }}
        animate={{
          opacity: isMultiplayer ? 0.7 : [1, 0, 1],
          x: left,
          y: top + offsetY,
        }}
        transition={{
          opacity: isMultiplayer
            ? { duration: 0 } // No blinking for multiplayer
            : {
                repeat: Infinity,
                duration: 0.8,
                ease: "easeInOut",
              },
          x: { duration: 0.15, ease: "easeOut" },
          y: { duration: 0.15, ease: "easeOut" },
        }}
      />
    );
  },
);

Caret.displayName = "Caret";
