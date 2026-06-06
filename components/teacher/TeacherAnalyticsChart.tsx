"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CourseData {
  id: string;
  title: string;
  progress: number;
  enrollments: number;
  lessons: number;
  category: string;
  is_published: boolean;
  created_at: string;
}

interface StudentData {
  id: string;
  created_at: string;
}

interface EnrollmentData {
  id: string;
  course_id: string;
  user_id: string;
  enrolled_at: string;
}

interface TeacherAnalyticsChartProps {
  courses: CourseData[];
  students: StudentData[];
  enrollments: EnrollmentData[];
}

const CHART_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f97316", "#3b82f6", "#f43f5e"];

const tooltipStyle = {
  background: "#09090b",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 11,
  color: "#e4e4e7",
};

export default function TeacherAnalyticsChart({ courses, students, enrollments }: TeacherAnalyticsChartProps) {

  // 1. Course Progress Bar Chart
  const progressData = useMemo(() =>
    courses.slice(0, 8).map((c) => ({
      name: c.title.length > 18 ? c.title.slice(0, 18) + "…" : c.title,
      Progress: c.progress,
      Enrollments: c.enrollments,
    })),
    [courses]
  );

  // 2. Enrollments over time (Area Chart — group by week)
  const enrollmentTrend = useMemo(() => {
    const counts: Record<string, number> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    enrollments.forEach((e) => {
      const date = new Date(e.enrolled_at ?? e.id); // fallback
      const month = monthNames[date.getMonth()];
      const week = Math.ceil(date.getDate() / 7);
      const key = `${month} W${week}`;
      counts[key] = (counts[key] ?? 0) + 1;
    });

    const keys = Object.keys(counts).sort();
    if (keys.length === 0) {
      return [{ period: "No Data", enrollments: 0 }];
    }
    return keys.map((k) => ({ period: k, enrollments: counts[k] }));
  }, [enrollments]);

  // 3. Students joined per month (Bar)
  const studentsJoined = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      const d = new Date(s.created_at);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      counts[key] = (counts[key] ?? 0) + 1;
    });
    const keys = Object.keys(counts).sort();
    if (keys.length === 0) return [{ month: "No Data", students: 0 }];
    return keys.map((k) => ({ month: k, students: counts[k] }));
  }, [students]);

  // 4. Published vs Draft pie
  const publishedData = useMemo(() => {
    const pub = courses.filter((c) => c.is_published).length;
    const draft = courses.length - pub;
    return [
      { name: "Published", value: pub },
      { name: "Draft", value: draft },
    ];
  }, [courses]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* 1. Course Progress & Enrollments */}
      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 md:col-span-2">
        <h3 className="text-sm font-bold text-white mb-1">Course Performance</h3>
        <p className="text-[10px] font-semibold text-zinc-500 mb-5 uppercase tracking-wider">
          Progress % and enrollment count per course
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progressData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#71717a" fontSize={9} />
              <YAxis tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(139,92,246,0.05)" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: "#71717a" }} />
              <Bar dataKey="Progress" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Enrollments" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 2. Enrollment Trend */}
      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-bold text-white mb-1">Enrollment Trend</h3>
        <p className="text-[10px] font-semibold text-zinc-500 mb-5 uppercase tracking-wider">
          New enrollments grouped by week
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={enrollmentTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} stroke="#71717a" fontSize={9} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="enrollments" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#enrollGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 3. Student Growth */}
      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-bold text-white mb-1">Student Growth</h3>
        <p className="text-[10px] font-semibold text-zinc-500 mb-5 uppercase tracking-wider">
          New students registered per month
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={studentsJoined} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#71717a" fontSize={9} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(6,182,212,0.05)" }} />
              <Bar dataKey="students" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 4. Published vs Draft */}
      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-bold text-white mb-1">Catalog Status</h3>
        <p className="text-[10px] font-semibold text-zinc-500 mb-5 uppercase tracking-wider">
          Published vs draft course ratio
        </p>
        <div className="h-56 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={publishedData}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {publishedData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: "#71717a" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 5. Course Progress Line */}
      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-bold text-white mb-1">Completion Curve</h3>
        <p className="text-[10px] font-semibold text-zinc-500 mb-5 uppercase tracking-wider">
          Per-course average completion %
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#71717a" fontSize={8} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} stroke="#71717a" fontSize={10} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="Progress" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  );
}
