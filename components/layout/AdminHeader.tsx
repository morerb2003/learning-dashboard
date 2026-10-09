"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Menu, ChevronDown, User, Settings, Activity } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import LogoutButton from "@/components/auth/LogoutButton";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  user: {
    full_name?: string | null;
    email?: string | null;
    role?: string;
  };
  onMenuToggle?: () => void;
}

export default function AdminHeader({
  title = "System Control Center",
  subtitle = "Manage platform users, moderate courses, and review security logs",
  user,
  onMenuToggle,
}: AdminHeaderProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const displayName = user.full_name || user.email?.split("@")[0] || "Admin";

  return (
    <header className="flex min-h-20 items-center justify-between border-b border-white/10 bg-zinc-950/60 px-4 py-4 backdrop-blur-xl md:px-8 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl border border-white/10 bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div>
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-violet-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-violet-400" /> AURA Admin Console
            </span>
          </div>
          <h1 className="text-lg font-black tracking-tight text-white md:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden md:block mt-0.5 text-xs font-medium text-zinc-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Modern Telemetry Status Badges */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0b0f19] border border-white/[0.07] text-xs shadow-sm">
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
            Ops v4.8
          </span>
          <div className="h-3 w-px bg-white/10"></div>
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Razorpay Live
          </span>
          <div className="h-3 w-px bg-white/10"></div>
          <span className="text-[10px] text-slate-400">
            Sync: <strong className="text-white">1.2s</strong>
          </span>
        </div>

        {/* Quick Role Switcher Pills */}
        <div className="hidden md:flex items-center p-1 rounded-full bg-[#0b0f19] border border-white/[0.07] text-[11px] font-semibold">
          <Link
            href="/learning"
            className="px-3 py-1 rounded-full text-slate-400 hover:text-white transition-all"
          >
            Student
          </Link>
          <Link
            href="/teacher"
            className="px-3 py-1 rounded-full text-slate-400 hover:text-white transition-all"
          >
            Teacher
          </Link>
          <Link
            href="/admin"
            className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]"
          >
            Admin
          </Link>
        </div>

        <NotificationBell />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-violet-500/20">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-zinc-950/95 p-2 backdrop-blur-xl shadow-2xl z-40 space-y-1 text-xs">
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="font-bold text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  Settings
                </Link>
                <div className="pt-1 border-t border-white/5">
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
