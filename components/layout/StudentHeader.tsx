"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, User, Settings, LogOut, ChevronDown, Sparkles } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/5 bg-zinc-950/60 px-4 md:px-8 backdrop-blur-xl shrink-0">
      {/* Page Title & Breadcrumbs */}
      <div>
        <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="hidden sm:block text-xs font-medium text-zinc-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Center Search (optional) */}
      {onSearchChange && (
        <div className="hidden lg:flex items-center relative max-w-xs w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search courses, lessons..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      )}

      {/* Right Controls: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-4">
        <NotificationBell />

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-violet-500/20">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-zinc-200 leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-zinc-500 capitalize">
                {user.role || "Student"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-zinc-950/95 p-2 backdrop-blur-xl shadow-2xl z-40 space-y-1 text-xs">
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
