"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  Activity,
  Megaphone,
  ScanSearch,
  DollarSign,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar_url?: string | null;
}

interface AdminSidebarProps {
  adminProfile: AdminProfile;
  isMobile?: boolean;
}

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/analytics/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/activity", label: "Activity Logs", icon: Activity },
  { href: "/admin/moderation", label: "Moderation", icon: ScanSearch },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export default function AdminSidebar({ adminProfile, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const adminName = adminProfile.full_name || adminProfile.email?.split("@")[0] || "Admin";
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
            // Exact match for /admin, prefix match for others to keep active state clean
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : item.href === "/admin/analytics"
                ? pathname === "/admin/analytics"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-violet-500/15 text-white ring-1 ring-violet-500/20"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-violet-300" : "text-zinc-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 mt-auto">
        <p className="text-xs font-bold text-white truncate">{adminName}</p>
        <p className="mt-0.5 truncate text-[10px] text-zinc-500">{adminProfile.email}</p>
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
