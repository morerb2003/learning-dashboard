"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface UserProfile {
  id: string;
  role: string;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  progress: number;
}

interface AnalyticsChartProps {
  users: UserProfile[];
  courses: Course[];
  notes: Array<{ id: string; created_at: string }>;
  enrollments: Array<{ id: string; enrolled_at: string }>;
  lessonProgress: Array<{ id: string; completed_at: string | null }>;
  attempts: Array<{ id: string; score: number; total_score: number; submitted_at: string }>;
  submissions: Array<{ id: string; status: string; submitted_at: string; reviewed_at: string | null }>;
}

const roleColors: Record<string, string> = {
  student: "#22d3ee", // cyan-400
  teacher: "#a78bfa", // violet-400
  admin: "#f87171",   // red-400
};

export default function AnalyticsChart({
  users,
  courses,
  notes,
  enrollments,
  lessonProgress,
  attempts,
  submissions,
}: AnalyticsChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // 1. Role Distribution Data (Pie Chart)
  const roleData = useMemo(() => {
    const counts = users.reduce<Record<string, number>>(
      (acc, user) => {
        const r = user.role.toLowerCase();
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      },
      { student: 0, teacher: 0, admin: 0 }
    );

    return [
      { name: "Student", value: counts.student },
      { name: "Teacher", value: counts.teacher },
      { name: "Admin", value: counts.admin },
    ];
  }, [users]);

  // 2. Users Joined Per Week (Bar Chart)
  const usersJoinedData = useMemo(() => {
    // Group users by week of the year
    const weeklyCounts: Record<string, number> = {};

    users.forEach((user) => {
      const date = new Date(user.created_at);
      // Simple week key: e.g. "May W4"
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const weekNum = Math.ceil(date.getDate() / 7);
      const weekKey = `${month} W${weekNum}`;
      
      weeklyCounts[weekKey] = (weeklyCounts[weekKey] || 0) + 1;
    });

    // Make sure we have at least some weeks sorted chronologically
    // Sort keys based on creation date approximations if possible, or just alphabetically
    const keys = Object.keys(weeklyCounts).sort();
    
    // If no users, provide fallback
    if (keys.length === 0) {
      return [
        { week: "Week 1", count: 0 },
        { week: "Week 2", count: 0 },
        { week: "Week 3", count: 0 },
        { week: "Week 4", count: 0 },
      ];
    }

    return keys.map((key) => ({
      week: key,
      count: weeklyCounts[key],
    }));
  }, [users]);

  // 3. Course Progress Trends (Line Chart)
  const courseProgressData = useMemo(() => {
    if (courses.length === 0) {
      return [
        { name: "Course A", progress: 0 },
        { name: "Course B", progress: 0 },
      ];
    }

    return courses.map((course) => ({
      name: course.title.length > 12 ? `${course.title.slice(0, 12)}...` : course.title,
      progress: course.progress || 0,
    }));
  }, [courses]);

  // 4. Daily Activity over last 7 days (Area Chart)
  const dailyActivityData = useMemo(() => {
    const activityCounts = new Map<string, number>();

    // Generate the last 7 calendar days in order
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      activityCounts.set(key, 0);
    }

    const addActivity = (timestamp: string | null | undefined) => {
      if (!timestamp) return;
      const key = new Date(timestamp).toISOString().split("T")[0];
      if (activityCounts.has(key)) {
        activityCounts.set(key, (activityCounts.get(key) ?? 0) + 1);
      }
    };

    users.forEach((row) => addActivity(row.created_at));
    notes.forEach((row) => addActivity(row.created_at));
    enrollments.forEach((row) => addActivity(row.enrolled_at));
    lessonProgress.forEach((row) => addActivity(row.completed_at));
    attempts.forEach((row) => addActivity(row.submitted_at));
    submissions.forEach((row) => addActivity(row.submitted_at));

    return Array.from(activityCounts, ([date, activity]) => ({
      day: new Date(`${date}T00:00:00`).toLocaleDateString("en", { weekday: "short" }),
      activity,
    }));
  }, [attempts, enrollments, lessonProgress, notes, submissions, users]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* 1. Bar Chart: Users Joined Per Week */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-bold text-white mb-1">Users Joined</h3>
        <p className="text-[10px] font-semibold text-zinc-500 mb-4 uppercase tracking-wider">Registration rate grouped by week</p>
        <div className="w-full h-64 min-h-[256px] min-w-0 relative">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240} debounce={50}>
              <BarChart data={usersJoinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  cursor={{ fill: "rgba(139, 92, 246, 0.05)" }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
          )}
        </div>
      </section>

      {/* 2. Line Chart: Course Progress Trends */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-bold text-white mb-1">Course Progress</h3>
        <p className="text-[10px] font-semibold text-zinc-500 mb-4 uppercase tracking-wider">Completion trends per learning module</p>
        <div className="w-full h-64 min-h-[256px] min-w-0 relative">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240} debounce={50}>
              <LineChart data={courseProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#71717a" fontSize={8} />
                <YAxis tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
          )}
        </div>
      </section>

      {/* 3. Pie Chart: Role Distribution */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-bold text-white mb-1">Role Distribution</h3>
        <p className="text-[10px] font-semibold text-zinc-500 mb-4 uppercase tracking-wider">Account configurations inside Supabase</p>
        <div className="w-full h-64 min-h-[256px] min-w-0 relative flex items-center justify-center">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240} debounce={50}>
              <PieChart>
                <Pie
                  data={roleData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={roleColors[entry.name.toLowerCase()] || "#71717a"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
          )}
        </div>
      </section>

      {/* 4. Area Chart: Daily Activity */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-bold text-white mb-1">Daily Activity</h3>
        <p className="text-[10px] font-semibold text-zinc-500 mb-4 uppercase tracking-wider">Database interactions over the last 7 days</p>
        <div className="w-full h-64 min-h-[256px] min-w-0 relative">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240} debounce={50}>
              <AreaChart data={dailyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} />
                <YAxis tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="activity" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActivity)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
          )}
        </div>
      </section>

    </div>
  );
}
