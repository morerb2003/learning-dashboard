"use client";

import React, { useState } from "react";
import { Menu, X, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TeacherSidebar from "./TeacherSidebar";

interface TeacherProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar_url?: string | null;
}

interface TeacherLayoutProps {
  children: React.ReactNode;
  profile: TeacherProfile;
}

export default function TeacherLayout({ children, profile }: TeacherLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/8 blur-[120px]" />
      </div>

      {/* Desktop Sidebar */}
      <TeacherSidebar teacherProfile={profile} />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-white/10 p-5 flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">Teacher Portal</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">AURA LMS</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-xl border border-white/5 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 flex flex-col" onClick={() => setIsMobileOpen(false)}>
                <div className="w-full h-full flex flex-col justify-between">
                  <TeacherSidebar teacherProfile={profile} isMobile />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto no-scrollbar relative z-10">
        {/* Top Header */}
        <header className="flex min-h-20 items-center justify-between border-b border-white/10 bg-zinc-950/60 px-4 py-4 backdrop-blur-xl md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <div className="mb-0.5 flex items-center gap-2 lg:hidden">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  AURA Teacher
                </span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-white md:text-xl">
                Teacher Dashboard
              </h1>
              <p className="hidden md:block mt-0.5 text-xs font-medium text-zinc-500">
                Manage your courses, students, and track teaching analytics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              Live Session
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="flex-1 space-y-6 p-4 md:p-8 no-scrollbar">
          {children}
        </section>
      </main>
    </div>
  );
}
