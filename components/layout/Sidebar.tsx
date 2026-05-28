"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap,
  Sparkles,
  StickyNote
} from "lucide-react";

export type TabId = "dashboard" | "courses" | "analytics" | "notes" | "settings";

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  profile: {
    full_name: string;
    email: string;
    role: string;
  };
}

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "courses", label: "My Courses", icon: BookOpen },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, profile }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <aside 
        className={`
          hidden md:flex flex-col shrink-0
          bg-zinc-950/40 backdrop-blur-xl border-r border-white/10
          h-screen sticky top-0 transition-all duration-300 ease-in-out z-30
          ${isCollapsed ? "w-20" : "w-20 lg:w-64"}
        `}
      >
        {/* Sidebar Header Logo */}
        <div className="h-20 flex items-center px-6 border-b border-white/5 relative justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col select-none whitespace-nowrap"
                >
                  <span className="font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 text-sm">
                    AURA
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                    LEARN <Sparkles className="w-2.5 h-2.5 text-violet-400 animate-pulse" />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse Button (Only visible on large screens where it can actually collapse) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-6 h-6 rounded-md border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white items-center justify-center transition-colors absolute -right-3 top-7 z-40 shadow-md"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 flex flex-col justify-between">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              // On tablet (md:max-lg), force collapsed appearance
              const displayCollapsed = isCollapsed;

              return (
                <li key={item.id} className="relative">
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      w-full flex items-center gap-4 py-3 rounded-xl text-sm font-medium transition-colors relative group
                      ${displayCollapsed ? "justify-center px-0" : "px-4"}
                      ${isActive ? "text-white" : "text-zinc-400 hover:text-white"}
                    `}
                  >
                    {/* Active highlight background pill using layoutId */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabGlow"
                        className="absolute inset-0 bg-gradient-to-r from-violet-600/15 to-indigo-600/10 border-l-2 border-violet-500 rounded-xl"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}

                    <div className="relative z-10">
                      <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-violet-400" : "text-zinc-400 group-hover:text-white"}`} />
                    </div>

                    <AnimatePresence>
                      {!displayCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="relative z-10 font-medium tracking-wide text-xs lg:text-sm whitespace-nowrap block"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Tooltip for collapsed states */}
                    {displayCollapsed && (
                      <div className="absolute left-20 bg-zinc-900 border border-white/10 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-xl whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* User profile section at the bottom */}
          <div className={`mt-auto border-t border-white/5 pt-4 ${isCollapsed ? "flex justify-center" : "px-3"}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 shrink-0 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-cyan-500/10">
                {profile.full_name.charAt(0)}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col whitespace-nowrap overflow-hidden">
                  <span className="text-xs font-semibold text-white truncate max-w-[130px]">{profile.full_name}</span>
                  <span className="text-[10px] text-zinc-500 truncate max-w-[130px]">{profile.email}</span>
                </div>
              )}
            </div>
          </div>
        </nav>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-lg border-t border-white/10 z-50 flex items-center justify-around md:hidden px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-zinc-400 relative"
              aria-label={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="activeMobileTabGlow"
                  className="absolute inset-x-2 top-1 bottom-1 bg-violet-600/15 border-t-2 border-violet-500 rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "text-violet-400 scale-110" : "text-zinc-500"}`} />
              <span className={`text-[10px] mt-1 font-medium tracking-wide ${isActive ? "text-white font-semibold" : "text-zinc-500"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}