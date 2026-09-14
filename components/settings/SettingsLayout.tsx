"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Briefcase,
  Check,
  CreditCard,
  DollarSign,
  Eye,
  Globe,
  Lock,
  Moon,
  Palette,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  User,
  Zap,
} from "lucide-react";

export interface SettingsTab {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

interface SettingsLayoutProps {
  userRole: string;
  userFullName: string;
  userEmail: string;
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export default function SettingsLayout({
  userRole,
  userFullName,
  userEmail,
  tabs,
  activeTab,
  onTabChange,
  children,
}: SettingsLayoutProps) {
  const role = userRole?.toLowerCase() || "student";
  const backHref = role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/dashboard";
  const backLabel = role === "admin" ? "Back to Admin" : role === "teacher" ? "Back to Teacher" : "Back to Dashboard";

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative">
      {/* Mesh Background */}
      <div className="fixed inset-0 bg-mesh-violet opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-mesh-cyan opacity-10 pointer-events-none mix-blend-screen" />

      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 glass-card border-b border-white/5 px-4 md:px-8 h-16 flex items-center justify-between">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-xs md:text-sm font-semibold text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {backLabel}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="text-xs font-bold text-zinc-400 hover:text-cyan-300 transition-colors hidden sm:block"
          >
            Switch to Public Profile &rarr;
          </Link>
          <span className="px-3 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-zinc-300 capitalize">
            {role} Settings
          </span>
        </div>
      </nav>

      {/* Header Container */}
      <header className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <Settings className="w-3.5 h-3.5" />
                <span>Account & Platform Settings</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
                {currentTabObj.label}
              </h1>
              <p className="text-xs md:text-sm text-zinc-400 mt-1">
                {currentTabObj.description}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400 bg-white/[0.03] border border-white/5 px-4 py-2.5 rounded-2xl w-fit">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Signed in as <strong className="text-white">{userFullName}</strong> ({userEmail})</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Settings Body */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Sidebar Nav */}
          <aside className="lg:col-span-3 space-y-1">
            <div className="flex lg:flex-col overflow-x-auto no-scrollbar gap-1.5 pb-2 lg:pb-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all text-left whitespace-nowrap lg:whitespace-normal w-full ${
                      isActive
                        ? "bg-white/10 text-white shadow-inner border border-white/10"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : "text-zinc-500"}`} />
                    <span className="flex-1">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Settings Tab Content */}
          <main className="lg:col-span-9 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
