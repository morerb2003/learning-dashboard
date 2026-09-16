"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

interface TextRevealProps {
  text: string;
  className?: string;
  gradientClassName?: string;
  highlightWords?: string[];
  delay?: number;
}

export default function TextReveal({
  text,
  className = "",
  gradientClassName = "bg-linear-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-transparent",
  highlightWords = [],
  delay = 0,
}: TextRevealProps) {
  const words = text.split(" ");

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: delay * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 18,
        stiffness: 140,
      },
    },
    hidden: {
      opacity: 0,
      y: 18,
      filter: "blur(4px)",
      transition: {
        type: "spring",
        damping: 18,
        stiffness: 140,
      },
    },
  };

  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="visible"
      className={`inline-flex flex-wrap ${className}`}
    >
      {words.map((word, index) => {
        const isHighlight = highlightWords.some(
          (hw) => word.toLowerCase().includes(hw.toLowerCase())
        );

        return (
          <motion.span
            variants={child}
            key={index}
            className={`mr-[0.28em] inline-block ${
              isHighlight ? gradientClassName : ""
            }`}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.span>
  );
}
