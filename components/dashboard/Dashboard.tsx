"use client";

import React, { useState } from "react";
import Sidebar, { TabId } from "@/components/layout/Sidebar";
import BentoGrid from "@/components/layout/BentoGrid";
import { Course } from "@/types/course";
import { Note } from "@/types/note";
import { 
  Sparkles, 
  GraduationCap,
  ArrowUpRight,
  Search,
  Filter,
  User,
  Shield,
  Bell
} from "lucide-react";
import ActivityChart from "./ActivityChart";
import CourseCard from "./CourseCard";
import NotesView from "./NotesView";
import LogoutButton from "@/components/auth/LogoutButton";

export interface Profile {
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
}

interface DashboardProps {
  initialCourses: Course[];
  initialNotes: Note[];
  profile: Profile;
}

export default function Dashboard({ initialCourses, initialNotes, profile }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const displayName = profile.full_name || profile.email.split("@")[0] || "Student";

  // Clean data fallback for client display
  const courses = initialCourses.length > 0 ? initialCourses : [
    {
      id: "1",
      title: "Advanced React Patterns",
      progress: 75,
      icon_name: "Atom",
      created_at: "2026-05-25T12:00:00.000Z"
    },
    {
      id: "2",
      title: "Next.js App Router Architecture",
      progress: 40,
      icon_name: "Network",
      created_at: "2026-05-25T12:00:00.000Z"
    },
    {
      id: "3",
      title: "Framer Motion Animations",
      progress: 90,
      icon_name: "Sparkles",
      created_at: "2026-05-25T12:00:00.000Z"
    },
    {
      id: "4",
      title: "Supabase & Postgres Masterclass",
      progress: 15,
      icon_name: "Database",
      created_at: "2026-05-25T12:00:00.000Z"
    }
  ];

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-zinc-950/20 text-zinc-100">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={{ ...profile, full_name: displayName }} />

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar pb-24 md:pb-6">
        
        {/* Mobile Header bar */}
        <header className="h-16 flex items-center justify-between border-b border-white/5 px-6 shrink-0 md:hidden bg-zinc-950/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 text-sm">
              AURA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <LogoutButton />
          </div>
        </header>

        <header className="hidden md:flex items-center justify-between h-20 px-8 shrink-0 border-b border-white/5 bg-zinc-950/5 backdrop-blur-sm">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Welcome back, {displayName}
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
            </h1>
            <p className="text-[11px] text-zinc-500 font-medium">AURA Student Portal &bull; Term 2</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full font-semibold">
              Live Connection
            </span>
            <LogoutButton />
          </div>
        </header>

        {/* Tab Subviews */}
        <section className="flex-1 p-4 md:p-6 lg:p-8 no-scrollbar">
          
          {/* 1. Dashboard View */}
          {activeTab === "dashboard" && (
            <BentoGrid courses={initialCourses} fullName={profile.full_name} />
          )}

          {/* 2. Courses View */}
          {activeTab === "courses" && (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Search and filter bar */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-900/30 backdrop-blur-xl border border-white/5 p-4 rounded-3xl">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search enrolled courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-2 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-white/5 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-950/20 hover:bg-zinc-900/50 transition-colors cursor-pointer w-full sm:w-auto justify-center">
                  <Filter className="w-3.5 h-3.5" /> Filter Modules
                </button>
              </div>

              {/* Course Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course, idx) => (
                    <CourseCard key={course.id} course={course} index={idx} />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-zinc-500 text-sm">
                    No courses match your search criteria.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Analytics View */}
          {activeTab === "analytics" && (
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Detailed Area Chart */}
              <div className="lg:col-span-2 glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                <div className="absolute inset-0 bg-mesh-violet opacity-65 pointer-events-none" />
                <div className="grain-overlay" />
                <ActivityChart />
              </div>

              {/* Sidebar stats panel */}
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-mesh-cyan opacity-50 pointer-events-none" />
                  <h3 className="text-sm font-bold text-white mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-zinc-400">Average Course Progress</span>
                      <span className="text-sm font-bold text-cyan-400">55%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-zinc-400">Total Study Modules</span>
                      <span className="text-sm font-bold text-white">16</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-zinc-400">Streak Attendance Rate</span>
                      <span className="text-sm font-bold text-emerald-400">98%</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-mesh-orange opacity-40 pointer-events-none" />
                  <h3 className="text-sm font-bold text-white mb-3">Goal Completion</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-r-transparent flex items-center justify-center text-xs font-bold text-violet-400">
                      75%
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Daily targets reached</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">3/4 goals completed today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Notes View */}
          {activeTab === "notes" && (
            <NotesView initialNotes={initialNotes} />
          )}

          {/* 5. Settings View */}
          {activeTab === "settings" && (
            <div className="max-w-4xl mx-auto glass-card rounded-3xl overflow-hidden relative">
              <div className="absolute inset-0 bg-mesh-violet opacity-45 pointer-events-none" />
              <div className="grain-overlay" />
              
              <div className="p-6 md:p-8 space-y-8 relative z-10">
                {/* Account Section */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-violet-400" /> Account Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        defaultValue={displayName} 
                        className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-violet-500/50" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        defaultValue={profile.email} 
                        className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-violet-500/50" 
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Account Role</label>
                      <input 
                        type="text" 
                        disabled
                        value={profile.role} 
                        className="w-full bg-zinc-950/20 border border-white/5 rounded-2xl py-2.5 px-4 text-sm text-zinc-500 capitalize cursor-not-allowed select-none" 
                      />
                    </div>
                  </div>
                </section>

                {/* Notifications Section */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-violet-400" /> Portal Notifications
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs font-semibold text-white">Daily Streak Reminders</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Receive reminders 2 hours before streak resets</p>
                      </div>
                      <div className="w-9 h-5 rounded-full bg-violet-600 p-0.5 flex items-center justify-end cursor-pointer">
                        <div className="w-4 h-4 rounded-full bg-white" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs font-semibold text-white">Course Progress Reports</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Weekly summaries of your performance stats</p>
                      </div>
                      <div className="w-9 h-5 rounded-full bg-violet-600 p-0.5 flex items-center justify-end cursor-pointer">
                        <div className="w-4 h-4 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Privacy & Security Section */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-violet-400" /> Privacy & Security
                  </h3>
                  <div className="flex items-center justify-between bg-zinc-950/20 border border-white/5 rounded-2xl p-4">
                    <div>
                      <p className="text-xs font-bold text-white">Two-Factor Authentication</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Secure your learning account with 2FA verification.</p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-white/10 hover:border-violet-500/20 text-[10px] font-bold text-white rounded-xl transition-colors cursor-pointer">
                      Configure <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
