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
  User,
  Shield,
  Bell,
  Save,
  X,
  Crown,
  CheckCircle,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

const ActivityChart = dynamic(() => import("./ActivityChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[220px] rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse flex flex-col justify-center items-center p-6 text-xs font-semibold text-zinc-500">
      Loading activity visualization...
    </div>
  ),
});

import CourseCard from "./CourseCard";
import NotesView from "./NotesView";
import LogoutButton from "@/components/auth/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";
import RealtimeRefresh from "@/components/realtime/RealtimeRefresh";
import CheckoutModal from "@/components/course/CheckoutModal";

export interface Profile {
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
  subscription_tier?: string | null;
}

interface DashboardProps {
  initialCourses: Course[];
  initialNotes: Note[];
  profile: Profile;
  totalCompletedLessons?: number;
  analytics: {
    averageCourseProgress: number;
    averageQuizScore: number;
    assignmentCompletion: number;
    streakDays: number;
    activeWeekdays: number[];
    weeklyActivity: Array<{ day: string; modules: number }>;
  };
  defaultTab?: TabId;
}

export default function Dashboard({
  initialCourses,
  initialNotes,
  profile,
  totalCompletedLessons = 0,
  analytics,
  defaultTab = "dashboard",
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [courseSort, setCourseSort] = useState("newest");

  const [fullName, setFullName] = useState(profile.full_name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const isPro =
    profile.subscription_tier === "pro" ||
    profile.subscription_tier === "premium";

  const displayName = fullName || profile.email.split("@")[0] || "Student";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSavingProfile(true);
    setProfileStatus(null);

    const supabase = createClient();

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setProfileStatus({ type: "error", text: "You must be logged in to update your profile." });
        setIsSavingProfile(false);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          email: email,
        })
        .eq("id", user.id);

      if (profileError) {
        setProfileStatus({ type: "error", text: profileError.message });
        setIsSavingProfile(false);
        return;
      }

      if (email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: email,
          data: { full_name: fullName }
        });

        if (authError) {
          setProfileStatus({ 
            type: "error", 
            text: `Profile updated, but email update failed: ${authError.message}` 
          });
          setIsSavingProfile(false);
          return;
        }
        setProfileStatus({ 
          type: "success", 
          text: "Profile updated! A verification link has been sent to your new email." 
        });
      } else {
        await supabase.auth.updateUser({
          data: { full_name: fullName }
        });
        setProfileStatus({ type: "success", text: "Profile updated successfully!" });
      }

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setProfileStatus({ type: "error", text: errMsg });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const courses = initialCourses;

  const categories = Array.from(
    new Set(courses.map((course) => course.category).filter(Boolean))
  ) as string[];
  const levels = Array.from(
    new Set(courses.map((course) => course.level).filter(Boolean))
  ) as string[];
  const instructors = Array.from(
    new Set(courses.map((course) => course.teacher_name).filter(Boolean))
  ) as string[];
  const filteredCourses = courses
    .filter((course) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        `${course.title} ${course.description ?? ""} ${course.category ?? ""} ${
          course.teacher_name ?? ""
        }`
          .toLowerCase()
          .includes(query);
      return (
        matchesSearch &&
        (categoryFilter === "all" || course.category === categoryFilter) &&
        (levelFilter === "all" || course.level === levelFilter) &&
        (instructorFilter === "all" || course.teacher_name === instructorFilter)
      );
    })
    .sort((a, b) => {
      if (courseSort === "progress") return (b.progress ?? 0) - (a.progress ?? 0);
      if (courseSort === "title") return a.title.localeCompare(b.title);
      if (courseSort === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="flex min-h-screen bg-zinc-950/20 text-zinc-100">
      <RealtimeRefresh
        channelName="student-dashboard-live"
        tables={["courses", "enrollments", "lesson_progress", "attempts", "submissions"]}
      />
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
            <NotificationBell />
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
            <NotificationBell />
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
            <BentoGrid
              courses={initialCourses}
              fullName={profile.full_name}
              totalCompletedLessons={totalCompletedLessons}
              analytics={analytics}
            />
          )}

          {/* 2. Courses View */}
          {activeTab === "courses" && (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Search and filter bar */}
              <div className="grid gap-3 bg-zinc-900/30 backdrop-blur-xl border border-white/5 p-4 rounded-3xl md:grid-cols-2 xl:grid-cols-5">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search course catalog..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-2 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-2 text-xs font-semibold text-zinc-300 outline-none"
                >
                  <option value="all">All categories</option>
                  {categories.map((value) => <option key={value}>{value}</option>)}
                </select>
                <select
                  value={levelFilter}
                  onChange={(event) => setLevelFilter(event.target.value)}
                  className="rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-2 text-xs font-semibold text-zinc-300 outline-none"
                >
                  <option value="all">All difficulties</option>
                  {levels.map((value) => <option key={value}>{value}</option>)}
                </select>
                <select
                  value={instructorFilter}
                  onChange={(event) => setInstructorFilter(event.target.value)}
                  className="rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-2 text-xs font-semibold text-zinc-300 outline-none"
                >
                  <option value="all">All instructors</option>
                  {instructors.map((value) => <option key={value}>{value}</option>)}
                </select>
                <select
                  value={courseSort}
                  onChange={(event) => setCourseSort(event.target.value)}
                  className="rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-2 text-xs font-semibold text-zinc-300 outline-none"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="progress">Highest progress</option>
                  <option value="title">Title A-Z</option>
                </select>
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
                <ActivityChart data={analytics.weeklyActivity} />
              </div>

              {/* Sidebar stats panel */}
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-mesh-cyan opacity-50 pointer-events-none" />
                  <h3 className="text-sm font-bold text-white mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-zinc-400">Average Course Progress</span>
                      <span className="text-sm font-bold text-cyan-400">{analytics.averageCourseProgress}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-zinc-400">Total Study Modules</span>
                      <span className="text-sm font-bold text-white">{totalCompletedLessons}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-zinc-400">Streak Attendance Rate</span>
                      <span className="text-sm font-bold text-emerald-400">{analytics.averageQuizScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-mesh-orange opacity-40 pointer-events-none" />
                  <h3 className="text-sm font-bold text-white mb-3">Goal Completion</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-r-transparent flex items-center justify-center text-xs font-bold text-violet-400">
                      {analytics.assignmentCompletion}%
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Assignments submitted</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{analytics.streakDays}-day learning streak</p>
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
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-violet-400" /> Account Profile
                  </h3>

                  {/* Status Alerts */}
                  {profileStatus && (
                    <div
                      className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-medium ${
                        profileStatus.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                          : "bg-red-500/10 border-red-500/20 text-red-300"
                      }`}
                    >
                      <span>{profileStatus.text}</span>
                      <button
                        type="button"
                        onClick={() => setProfileStatus(null)}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-violet-500/50" 
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-violet-500/50" 
                        required
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

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                    >
                      {isSavingProfile ? (
                        "Saving Changes..."
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save Profile Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>

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

                {/* Pro Membership Section */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" /> Membership Plan
                  </h3>

                  {isPro ? (
                    <div className="flex items-center gap-4 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-orange-500/5 p-5">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                        <Crown className="w-5 h-5 text-amber-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-amber-200">AURA Pro — Active</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Unlimited premium course access, priority support & early features.</p>
                      </div>
                      <span className="shrink-0 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full uppercase tracking-wider">Active</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Plan comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Free plan */}
                        <div className="rounded-2xl border border-white/5 bg-zinc-950/30 p-4 space-y-3">
                          <p className="text-xs font-black text-white">Free Plan</p>
                          <p className="text-2xl font-black text-white">$0<span className="text-xs font-normal text-zinc-500">/mo</span></p>
                          <ul className="space-y-1.5">
                            {["Access to free courses","Community discussions","Progress tracking"].map((f) => (
                              <li key={f} className="flex items-center gap-2 text-[10px] text-zinc-400">
                                <CheckCircle className="w-3 h-3 text-zinc-600 shrink-0" />{f}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Pro plan */}
                        <div className="relative rounded-2xl border border-amber-400/30 bg-gradient-to-b from-amber-500/10 to-transparent p-4 space-y-3">
                          <span className="absolute top-3 right-3 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Recommended</span>
                          <p className="text-xs font-black text-amber-200">Pro Plan</p>
                          <p className="text-2xl font-black text-white">$19.99<span className="text-xs font-normal text-zinc-500">/mo</span></p>
                          <ul className="space-y-1.5">
                            {["Everything in Free","All premium courses","Certificate generation","Priority support","Early feature access"].map((f) => (
                              <li key={f} className="flex items-center gap-2 text-[10px] text-zinc-300">
                                <CheckCircle className="w-3 h-3 text-amber-400 shrink-0" />{f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsProModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-xs font-black text-zinc-950 shadow-lg shadow-amber-500/20 hover:brightness-110 transition cursor-pointer"
                      >
                        <Zap className="w-4 h-4" />
                        Upgrade to Pro &mdash; $19.99/mo
                      </button>
                    </div>
                  )}
                </section>

                {/* Pro checkout modal */}
                <CheckoutModal
                  isOpen={isProModalOpen}
                  onClose={() => setIsProModalOpen(false)}
                  onSuccess={() => {
                    setIsProModalOpen(false);
                    window.location.reload();
                  }}
                  title="AURA Pro Membership"
                  price={19.99}
                />
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
