"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  StickyNote,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";

type AdminTab = "overview" | "users" | "courses" | "analytics" | "settings";
type Role = "student" | "teacher" | "admin";

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalNotes: number;
  activeStudents: number;
}

export interface AdminProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
  avatar_url?: string | null;
  created_at: string;
}

export interface AdminCourseRow {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  level?: string | null;
  teacher_name?: string | null;
  progress?: number | null;
  color?: string | null;
  is_published?: boolean | null;
  created_at: string;
}

interface AdminDashboardProps {
  adminProfile: AdminProfileRow;
  stats: AdminStats;
  recentUsers: AdminProfileRow[];
  recentCourses: AdminCourseRow[];
}

const navItems: Array<{ id: AdminTab; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const statCards = [
  { key: "totalUsers", label: "Total Users", icon: Users, color: "text-cyan-300", bg: "bg-mesh-cyan" },
  { key: "totalCourses", label: "Total Courses", icon: BookOpen, color: "text-violet-300", bg: "bg-mesh-violet" },
  { key: "totalNotes", label: "Total Notes", icon: StickyNote, color: "text-orange-300", bg: "bg-mesh-orange" },
  { key: "activeStudents", label: "Active Students", icon: Activity, color: "text-emerald-300", bg: "bg-mesh-emerald" },
] as const;

const roleStyles: Record<Role, string> = {
  student: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  teacher: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  admin: "border-red-500/20 bg-red-500/10 text-red-300",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getDisplayName(profile: AdminProfileRow) {
  return profile.full_name || profile.email?.split("@")[0] || "Unnamed user";
}

export default function AdminDashboard({
  adminProfile,
  stats,
  recentUsers,
  recentCourses,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [userQuery, setUserQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const adminName = getDisplayName(adminProfile);

  const roleData = useMemo(() => {
    const roleCounts = recentUsers.reduce<Record<Role, number>>(
      (counts, user) => ({ ...counts, [user.role]: counts[user.role] + 1 }),
      { student: 0, teacher: 0, admin: 0 }
    );

    return [
      { role: "Students", count: roleCounts.student },
      { role: "Teachers", count: roleCounts.teacher },
      { role: "Admins", count: roleCounts.admin },
    ];
  }, [recentUsers]);

  const activityData = useMemo(
    () => [
      { label: "Users", value: stats.totalUsers },
      { label: "Courses", value: stats.totalCourses },
      { label: "Notes", value: stats.totalNotes },
      { label: "Students", value: stats.activeStudents },
    ],
    [stats]
  );

  const filteredUsers = recentUsers.filter((user) => {
    const query = userQuery.toLowerCase();
    return `${getDisplayName(user)} ${user.email ?? ""} ${user.role}`.toLowerCase().includes(query);
  });

  const filteredCourses = recentCourses.filter((course) => {
    const query = courseQuery.toLowerCase();
    return `${course.title} ${course.category ?? ""} ${course.level ?? ""} ${course.teacher_name ?? ""}`
      .toLowerCase()
      .includes(query);
  });

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-zinc-950/60 px-4 py-5 backdrop-blur-xl lg:flex lg:flex-col">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Student Portal
        </Link>

        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/10 text-red-300 ring-1 ring-red-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Admin Dashboard</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">AURA LMS</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-violet-500/15 text-white ring-1 ring-violet-500/20"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-violet-300" : "text-zinc-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-bold text-white">{adminName}</p>
          <p className="mt-0.5 truncate text-[10px] text-zinc-500">{adminProfile.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/15"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-20 flex-col gap-4 border-b border-white/10 bg-zinc-950/60 px-4 py-4 backdrop-blur-xl md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <GraduationCap className="h-5 w-5 text-violet-300" />
              <span className="text-xs font-black uppercase tracking-widest text-white">AURA Admin</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white md:text-2xl">LMS Control Center</h1>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              Users, courses, notes, and platform analytics for {adminName}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              Live Supabase Data
            </div>
            <Link
              href="/"
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
            >
              Portal
            </Link>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${
                  activeTab === item.id ? "bg-violet-500/15 text-white" : "bg-white/[0.03] text-zinc-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        <section className="flex-1 space-y-6 p-4 md:p-8">
          {activeTab === "overview" && (
            <>
              <StatsGrid stats={stats} />

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Panel title="Recent Users" subtitle="Newest profiles in the platform" className="xl:col-span-2">
                  <UsersTable users={recentUsers.slice(0, 5)} />
                </Panel>
                <Panel title="Platform Mix" subtitle="Core object distribution">
                  <MiniBarChart data={activityData} />
                </Panel>
              </div>

              <Panel title="Recent Courses" subtitle="Latest course catalog entries">
                <CoursesTable courses={recentCourses.slice(0, 5)} />
              </Panel>
            </>
          )}

          {activeTab === "users" && (
            <Panel title="User Management" subtitle="Search profiles and review role assignments">
              <SearchBox value={userQuery} onChange={setUserQuery} placeholder="Search users..." />
              <UsersTable users={filteredUsers} />
            </Panel>
          )}

          {activeTab === "courses" && (
            <Panel title="Course Management" subtitle="Review catalog, publishing state, and ownership">
              <SearchBox value={courseQuery} onChange={setCourseQuery} placeholder="Search courses..." />
              <CoursesTable courses={filteredCourses} />
            </Panel>
          )}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Panel title="Platform Analytics" subtitle="Users, courses, notes, and active students">
                <MiniAreaChart data={activityData} />
              </Panel>
              <Panel title="Role Distribution" subtitle="Visible profile roles from Supabase">
                <MiniBarChart data={roleData.map((item) => ({ label: item.role, value: item.count }))} />
              </Panel>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Panel title="Security Posture" subtitle="RBAC and RLS are both active">
                <div className="space-y-3 text-sm text-zinc-300">
                  <StatusLine label="Admin route guard" value="Enabled" />
                  <StatusLine label="Supabase RLS" value="Required" />
                  <StatusLine label="Session refresh" value="Proxy" />
                </div>
              </Panel>
              <Panel title="Database Scope" subtitle="Admin reads depend on Supabase policies">
                <p className="text-sm leading-6 text-zinc-400">
                  If counts only show your own profile or notes, add admin read policies for `profiles`, `notes`, and course
                  management tables in Supabase.
                </p>
              </Panel>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatsGrid({ stats }: { stats: AdminStats }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <article key={stat.key} className="relative min-h-36 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <div className={`absolute inset-0 ${stat.bg} opacity-35 pointer-events-none`} />
            <div className="grain-overlay" />
            <div className="relative z-10 flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{stat.label}</span>
              <div className={`rounded-lg border border-white/10 bg-white/[0.04] p-2 ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="relative z-10 mt-8 text-3xl font-black tracking-tight text-white">
              {stats[stat.key].toLocaleString()}
            </p>
          </article>
        );
      })}
    </section>
  );
}

function Panel({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-5 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-sm font-black text-white">{title}</h2>
          <p className="mt-1 text-[10px] font-medium text-zinc-500">{subtitle}</p>
        </div>
        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
      </div>
      {children}
    </section>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative mb-5 max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-zinc-950/50 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-violet-500/40"
      />
    </div>
  );
}

function UsersTable({ users }: { users: AdminProfileRow[] }) {
  if (!users.length) {
    return <EmptyState label="No users visible with the current RLS policies." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-xs">
        <thead>
          <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <th className="py-3">User</th>
            <th className="py-3">Role</th>
            <th className="py-3">Joined</th>
            <th className="py-3 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map((user) => (
            <tr key={user.id} className="text-zinc-300">
              <td className="py-3">
                <p className="font-bold text-white">{getDisplayName(user)}</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">{user.email ?? "No email"}</p>
              </td>
              <td className="py-3">
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${roleStyles[user.role]}`}>
                  {user.role}
                </span>
              </td>
              <td className="py-3 text-zinc-500">{formatDate(user.created_at)}</td>
              <td className="py-3 text-right">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Active
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CoursesTable({ courses }: { courses: AdminCourseRow[] }) {
  if (!courses.length) {
    return <EmptyState label="No courses found." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead>
          <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <th className="py-3">Course</th>
            <th className="py-3">Level</th>
            <th className="py-3">Teacher</th>
            <th className="py-3">Progress</th>
            <th className="py-3 text-right">State</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {courses.map((course) => (
            <tr key={course.id} className="text-zinc-300">
              <td className="py-3">
                <p className="font-bold text-white">{course.title}</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">{course.category || "General"}</p>
              </td>
              <td className="py-3 text-zinc-400">{course.level || "Beginner"}</td>
              <td className="py-3 text-zinc-400">{course.teacher_name || "Unassigned"}</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-violet-400" style={{ width: `${course.progress ?? 0}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500">{course.progress ?? 0}%</span>
                </div>
              </td>
              <td className="py-3 text-right">
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                    course.is_published ?? true
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                  }`}
                >
                  {course.is_published ?? true ? "Published" : "Draft"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniBarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} />
          <Tooltip cursor={{ fill: "rgba(139, 92, 246, 0.08)" }} contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
          <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniAreaChart({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="adminMetricFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} />
          <Tooltip cursor={{ stroke: "rgba(34, 211, 238, 0.18)" }} contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
          <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#adminMetricFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-950/40 px-3 py-2">
      <span className="text-zinc-400">{label}</span>
      <span className="font-bold text-emerald-300">{value}</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-white/10 bg-zinc-950/30 px-4 text-center text-sm text-zinc-500">
      {label}
    </div>
  );
}
