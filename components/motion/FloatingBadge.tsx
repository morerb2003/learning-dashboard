"use client";

import React from "react";
import { motion } from "framer-motion";

interface FloatingBadgeProps {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  pulse?: boolean;
  pulseColor?: string;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export default function FloatingBadge({
  children,
  icon: Icon,
  pulse = true,
  pulseColor = "bg-emerald-400",
  className = "",
  delay = 0,
  duration = 5,
  yOffset = 8,
}: FloatingBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [-yOffset, yOffset, -yOffset],
      }}
      transition={{
        opacity: { duration: 0.4, delay },
        scale: { duration: 0.4, delay },
        y: {
          duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
      }}
      className={`inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-zinc-950/80 px-3.5 py-1.5 shadow-xl backdrop-blur-xl ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${pulseColor}`}
          />
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${pulseColor}`}
          />
        </span>
      )}
      {Icon && <Icon className="h-3.5 w-3.5 text-zinc-300" />}
      <span className="text-xs font-semibold text-zinc-200">{children}</span>
    </motion.div>
  );
}
