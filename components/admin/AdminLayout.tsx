"use client";

import React, { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "./AdminSidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import RealtimeRefresh from "@/components/realtime/RealtimeRefresh";

interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar_url?: string | null;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  profile: AdminProfile;
}

export default function AdminLayout({ children, profile }: AdminLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <RealtimeRefresh
        channelName="admin-dashboard-live"
        tables={[
          "profiles",
          "courses",
          "lessons",
          "enrollments",
          "audit_logs",
          "payment_intents",
          "payments",
          "subscriptions",
          "revenue_ledger",
        ]}
      />
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px]" />
      </div>

      {/* Desktop Sidebar (stickied to left) */}
      <AdminSidebar adminProfile={profile} />

      {/* Mobile Drawer (AnimatePresence) */}
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

            {/* Drawer Container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-white/10 p-5 flex flex-col lg:hidden"
            >
              {/* Close Button & Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-300 ring-1 ring-red-500/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">Admin Portal</p>
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

              {/* Sidebar Content (wrapped to close drawer when link clicked) */}
              <div className="flex-1 flex flex-col" onClick={() => setIsMobileOpen(false)}>
                {/* We can re-use AdminSidebar's inner UI here or render a custom list.
                    Since AdminSidebar has responsive classes, we will render it natively in drawer without hidden class. */}
                <div className="w-full h-full flex flex-col justify-between">
                  <AdminSidebar adminProfile={profile} isMobile />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Administrative Viewport */}
      <main className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto no-scrollbar relative z-10">
        <header className="flex min-h-20 items-center justify-between border-b border-white/10 bg-zinc-950/60 px-4 py-4 backdrop-blur-xl md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            {/* Hamburger button for mobile/tablet */}
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
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">AURA Admin</span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-white md:text-xl">LMS Control Center</h1>
              <p className="hidden md:block mt-0.5 text-xs font-medium text-zinc-500">
                Manage global users, courses, platform analytics, and security settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              Live Connection
            </div>
          </div>
        </header>

        {/* Dynamic Subpage View */}
        <section className="flex-1 space-y-6 p-4 md:p-8 no-scrollbar">
          {children}
        </section>
      </main>
    </div>
  );
}
