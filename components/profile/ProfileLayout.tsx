"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Mail,
  MapPin,
  Calendar,
  Globe,
  Award,
  Flame,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { BaseProfile } from "@/types/profile";

export interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface ProfileLayoutProps {
  baseProfile: BaseProfile;
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  headerStats?: React.ReactNode;
}

export default function ProfileLayout({
  baseProfile,
  tabs,
  activeTab,
  onTabChange,
  children,
  headerStats,
}: ProfileLayoutProps) {
  const role = baseProfile.role?.toLowerCase() || "student";
  const name = baseProfile.full_name || baseProfile.email?.split("@")[0] || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleMeta = {
    student: {
      label: "Student",
      icon: GraduationCap,
      badgeClass: "from-cyan-500/20 to-violet-500/20 text-cyan-300 border-cyan-500/30",
      accentGlow: "bg-cyan-500/10",
      backHref: "/dashboard",
      backLabel: "Back to Dashboard",
    },
    teacher: {
      label: "Teacher / Instructor",
      icon: BookOpen,
      badgeClass: "from-sky-500/20 to-teal-500/20 text-sky-300 border-sky-500/30",
      accentGlow: "bg-sky-500/10",
      backHref: "/teacher",
      backLabel: "Back to Teacher Workspace",
    },
    admin: {
      label: "Platform Administrator",
      icon: ShieldCheck,
      badgeClass: "from-amber-500/20 to-rose-500/20 text-amber-300 border-amber-500/30",
      accentGlow: "bg-amber-500/10",
      backHref: "/admin",
      backLabel: "Back to Admin Overview",
    },
    pending_teacher: {
      label: "Pending Teacher",
      icon: BookOpen,
      badgeClass: "from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/30",
      accentGlow: "bg-yellow-500/10",
      backHref: "/dashboard",
      backLabel: "Back to Dashboard",
    },
  }[role] || {
    label: "Student",
    icon: GraduationCap,
    badgeClass: "from-cyan-500/20 to-violet-500/20 text-cyan-300 border-cyan-500/30",
    accentGlow: "bg-cyan-500/10",
    backHref: "/dashboard",
    backLabel: "Back to Dashboard",
  };

  const RoleIcon = roleMeta.icon;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative">
      {/* Background Decorative Mesh */}
      <div className="fixed inset-0 bg-mesh-violet opacity-25 pointer-events-none" />
      <div className="fixed inset-0 bg-mesh-cyan opacity-15 pointer-events-none mix-blend-screen" />

      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 glass-card border-b border-white/5 px-4 md:px-8 h-16 flex items-center justify-between">
        <Link
          href={roleMeta.backHref}
          className="flex items-center gap-2 text-xs md:text-sm font-semibold text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {roleMeta.backLabel}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 hidden sm:block">AURA Profile System</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r ${roleMeta.badgeClass}`}>
            <RoleIcon className="w-3.5 h-3.5" />
            {roleMeta.label}
          </span>
        </div>
      </nav>

      {/* Profile Header Banner */}
      <header className="relative z-10 border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Avatar & Identity */}
            <div className="flex items-start md:items-center gap-5">
              <div className="relative group">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl p-1 bg-gradient-to-br from-cyan-400 via-violet-500 to-rose-400 shadow-2xl shadow-cyan-500/10`}>
                  <div className="w-full h-full rounded-[22px] bg-zinc-900 flex items-center justify-center overflow-hidden text-2xl md:text-3xl font-black text-white">
                    {baseProfile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={baseProfile.avatar_url}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center shadow-lg" title="Active">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                    {name}
                  </h1>
                  {baseProfile.username && (
                    <span className="text-sm font-semibold text-zinc-400">
                      @{baseProfile.username}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    {baseProfile.email}
                  </span>
                  {baseProfile.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {baseProfile.location}
                    </span>
                  )}
                  {baseProfile.website && (
                    <a
                      href={baseProfile.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-cyan-300 hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Role-specific stats highlight */}
            {headerStats && (
              <div className="flex items-center gap-3 self-stretch md:self-auto">
                {headerStats}
              </div>
            )}
          </div>

          {/* Tab Navigation Strip */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-white/5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-colors whitespace-nowrap rounded-xl ${
                    isActive
                      ? "text-white bg-white/5 shadow-inner"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-zinc-500"}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-profile-tab"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Profile Body Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
