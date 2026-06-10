"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  BookOpen,
  HelpCircle,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Plus,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TeacherProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar_url?: string | null;
}

interface TeacherSidebarProps {
  teacherProfile: TeacherProfile;
  isMobile?: boolean;
}

const navItems = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/courses", label: "My Courses", icon: BookOpen },
  { href: "/teacher/courses/create", label: "Create Course", icon: Plus },
  { href: "/teacher/quizzes", label: "Quizzes", icon: HelpCircle },
  { href: "/teacher/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/teacher/students", label: "Students", icon: Users },
  { href: "/teacher/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/community", label: "Community", icon: MessagesSquare },
] as const;

export default function TeacherSidebar({ teacherProfile, isMobile = false }: TeacherSidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const teacherName = teacherProfile.full_name || teacherProfile.email?.split("@")[0] || "Teacher";
  const Wrapper = isMobile ? "div" : "aside";

  return (
    <Wrapper
      className={
        isMobile
          ? "flex flex-col h-full w-full justify-between"
          : "hidden w-72 shrink-0 border-r border-white/10 bg-zinc-950/60 px-4 py-5 backdrop-blur-xl lg:flex lg:flex-col h-screen sticky top-0"
      }
    >
      <div>
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Student Portal
        </Link>

        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Teacher Portal</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">AURA LMS</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/teacher"
                ? pathname === "/teacher"
                : pathname.startsWith(item.href);

            const isCreate = item.href === "/teacher/courses/create";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isCreate
                    ? isActive
                      ? "bg-emerald-500/15 text-white ring-1 ring-emerald-500/20"
                      : "text-emerald-300 hover:bg-emerald-500/10 hover:text-white border border-emerald-500/20"
                    : isActive
                    ? "bg-violet-500/15 text-white ring-1 ring-violet-500/20"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isCreate
                      ? isActive
                        ? "text-emerald-300"
                        : "text-emerald-400"
                      : isActive
                      ? "text-violet-300"
                      : "text-zinc-500"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 mt-auto">
        <p className="text-xs font-bold text-white truncate">{teacherName}</p>
        <p className="mt-0.5 truncate text-[10px] text-zinc-500">{teacherProfile.email}</p>
        <span className="mt-2 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-300">
          Teacher
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/15 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </Wrapper>
  );
}
