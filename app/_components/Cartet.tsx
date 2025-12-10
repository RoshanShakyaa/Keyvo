"use client";
import { motion } from "motion/react";

const Cartet = () => {
  return (
    <motion.div
      aria-hidden={true}
      className="inline-block bg-primary w-0.5 h-5.5"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
    ></motion.div>
  );
};

export default Cartet;
