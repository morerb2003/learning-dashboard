"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Atom, 
  Network, 
  Sparkles, 
  Database, 
  Code, 
  BookOpen, 
  Layers,
  ArrowRight
} from "lucide-react";
import { Course } from "@/types/course";

// Icon mapping to safely render Lucide icons dynamically based on db strings
const iconMap: Record<string, React.ComponentType<any>> = {
  Atom: Atom,
  React: Atom,
  Network: Network,
  Sparkles: Sparkles,
  Database: Database,
  Code: Code,
  BookOpen: BookOpen,
  Layers: Layers
};

interface CourseCardProps {
  course: Course;
  index: number;
}

export default function CourseCard({ course, index }: CourseCardProps) {
  // Find correct icon or default to BookOpen
  const IconComponent = iconMap[course.icon_name] || BookOpen;

  // Determine a unique mesh pattern class based on index
  const meshClasses = [
    "bg-mesh-violet",
    "bg-mesh-cyan",
    "bg-mesh-emerald",
    "bg-mesh-orange"
  ];
  const meshClass = meshClasses[index % meshClasses.length];

  return (
    <Link href={`/course/${course.id}`} className="block">
      <motion.article
      className="group relative rounded-3xl overflow-hidden glass-card p-6 flex flex-col justify-between h-52 cursor-pointer"
      whileHover={{
        scale: 1.015,
        y: -2,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
    >
      {/* Background Mesh Gradient */}
      <div className={`absolute inset-0 ${meshClass} z-0 transition-opacity duration-500 opacity-80 group-hover:opacity-100`} />
      
      {/* Noise overlay */}
      <div className="grain-overlay" />

      {/* Hover border glow - using opacity transition to avoid layout repaints */}
      <div className="absolute inset-0 rounded-3xl border border-violet-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

      {/* Card Content */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner transition-colors duration-300 group-hover:bg-violet-500/10 group-hover:border-violet-500/20">
          <IconComponent className="w-6 h-6 text-zinc-300 group-hover:text-violet-400 transition-colors duration-300" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <span className="text-violet-400">Continue</span>
          <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
        </div>
      </div>

      <div className="relative z-10 mt-auto space-y-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-violet-400/80">Active Module</span>
          <h3 className="text-base font-bold text-white tracking-wide mt-0.5 line-clamp-1 group-hover:text-violet-200 transition-colors duration-200">
            {course.title}
          </h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-500">Progress</span>
            <span className="text-zinc-300 group-hover:text-violet-400 transition-colors">{course.progress}%</span>
          </div>

          {/* Custom Animated Progress Bar - layout-shift free using scaleX */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: course.progress / 100 }}
              style={{ transformOrigin: "left" }}
              transition={{ 
                type: "spring", 
                stiffness: 85, 
                damping: 15,
                delay: 0.15 + index * 0.1 
              }}
            />
          </div>
        </div>
      </div>
    </motion.article>
    </Link>
  );
}
