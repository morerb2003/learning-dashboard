"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, User, Settings, LogOut, ChevronDown, Sparkles, Brain, Cpu, Wifi } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import LogoutButton from "@/components/auth/LogoutButton";

interface StudentHeaderProps {
  title?: string;
  subtitle?: string;
  user: {
    full_name?: string | null;
    email: string;
    role?: string;
    avatar_url?: string | null;
  };
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function StudentHeader({
  title = "Dashboard",
  subtitle,
  user,
  searchQuery,
  onSearchChange,
}: StudentHeaderProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const displayName = user.full_name || user.email.split("@")[0] || "Student";
  const userRole = (user.role || "student").toLowerCase();

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/[0.08] bg-[#0b0f19]/80 px-4 md:px-8 backdrop-blur-2xl shrink-0 transition-colors">
      {/* Left Title & Breadcrumbs + Role Switcher */}
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-lg md:text-xl font-heading font-bold tracking-tight text-white flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs font-medium text-[#849495] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Quick Role Switcher Pills (from Stitch design) */}
        <div className="hidden xl:flex items-center p-1 rounded-full bg-[#171b26] border border-white/[0.06] text-[11px] font-semibold">
          <Link
            href="/learning"
            className={`px-3 py-1 rounded-full transition-all ${
              userRole === "student"
                ? "bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 font-bold shadow-[0_0_12px_rgba(0,242,254,0.2)]"
                : "text-[#849495] hover:text-white"
            }`}
          >
            Student
          </Link>
          <Link
            href="/teacher"
            className={`px-3 py-1 rounded-full transition-all ${
              userRole === "teacher"
                ? "bg-[#818cf8]/15 text-[#818cf8] border border-[#818cf8]/30 font-bold shadow-[0_0_12px_rgba(129,140,248,0.2)]"
                : "text-[#849495] hover:text-white"
            }`}
          >
            Teacher
          </Link>
          <Link
            href="/admin"
            className={`px-3 py-1 rounded-full transition-all ${
              userRole === "admin"
                ? "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                : "text-[#849495] hover:text-white"
            }`}
          >
            Admin
          </Link>
        </div>
      </div>

      {/* Center Search with ⌘K (from Stitch design) */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#849495] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery || ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search courses, lessons, quizzes, jobs..."
            className="w-full bg-[#171b26]/80 border border-white/[0.08] rounded-xl pl-10 pr-12 py-2 text-xs text-[#dfe2f1] placeholder-[#849495] focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/50 transition-all shadow-inner"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd className="px-1.5 py-0.5 rounded bg-[#262a35] border border-white/10 text-[10px] text-[#849495] font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Live Redis Edge Latency pill (from Stitch design) */}
        <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171b26] border border-white/[0.06] text-[11px] shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
          </span>
          <span className="text-[#849495] uppercase tracking-wider text-[10px]">Redis</span>
          <span className="text-[#00f2fe] font-bold font-mono">18ms</span>
        </div>
      </div>

      {/* Right Controls: AI Tutor, Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick AI Tutor Trigger Button */}
        <Link
          href="/learning?tab=learning"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] hover:bg-[#00f2fe]/20 hover:shadow-[0_0_16px_rgba(0,242,254,0.3)] transition-all text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00f2fe] animate-pulse" />
          <span className="hidden sm:inline">AI Tutor</span>
        </Link>

        <NotificationBell />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer border border-transparent hover:border-white/10"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00f2fe] to-[#6366f1] flex items-center justify-center text-xs font-bold text-[#0b0f19] shadow-md shadow-[#00f2fe]/20">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#dfe2f1] leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-[#849495] capitalize">
                {user.role || "Student"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#849495]" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[#0f131d]/95 p-2 backdrop-blur-2xl shadow-2xl z-40 space-y-1 text-xs">
                <div className="px-3 py-2 border-b border-white/[0.08]">
                  <p className="font-bold text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-[#849495] truncate">{user.email}</p>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#00f2fe]" />
                  My Profile
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#10b981]" />
                  Settings
                </Link>

                <div className="pt-1 border-t border-white/[0.08]">
                  <LogoutButton className="w-full justify-start text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-2 rounded-xl" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
