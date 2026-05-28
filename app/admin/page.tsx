import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ShieldAlert, 
  Users, 
  BookOpen, 
  ArrowLeft, 
  Key, 
  Database, 
  Activity, 
  Sparkles,
  Server
} from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Route protection: restrict to admin role only
  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  // Mock Admin Dashboard data (would be fetched from DB in production)
  const systemStats = [
    { label: "Total Users", value: "1,284", change: "+12% this month", icon: Users, color: "text-cyan-400", bg: "bg-mesh-cyan" },
    { label: "Course Catalog", value: "24 Modules", change: "2 pending approval", icon: BookOpen, color: "text-violet-400", bg: "bg-mesh-violet" },
    { label: "Active Sessions", value: "342", change: "98.9% uptime", icon: Activity, color: "text-emerald-400", bg: "bg-mesh-emerald" },
    { label: "Security Status", value: "Optimal", change: "0 active alerts", icon: ShieldAlert, color: "text-orange-400", bg: "bg-mesh-orange" },
  ];

  const recentUsers = [
    { name: "Emily Watson", email: "emily.w@aura.edu", role: "student", status: "Active" },
    { name: "Prof. Marcus Thorne", email: "m.thorne@aura.edu", role: "teacher", status: "Active" },
    { name: "Sarah Jenkins", email: "s.jenkins@aura.edu", role: "student", status: "Pending" },
    { name: "Devon Lane", email: "devon.l@aura.edu", role: "teacher", status: "Active" }
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950/20 text-zinc-100 flex-col">
      {/* Top Admin Header */}
      <header className="h-20 border-b border-white/5 bg-zinc-950/40 backdrop-blur-md px-6 md:px-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Return to Student Portal"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AURA Management Console
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase tracking-widest">
                Admin Area
              </span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium">Administrator Node: {profile.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
            <Server className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Master Cluster</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Admin Console Area */}
      <main className="flex-1 p-6 md:p-12 max-w-7xl w-full mx-auto space-y-8">
        
        {/* Banner with mesh gradient */}
        <section className="rounded-3xl p-8 glass-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute inset-0 bg-mesh-violet opacity-65 pointer-events-none" />
          <div className="grain-overlay" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">System Status Update</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              All services operational.
            </h2>
            <p className="text-zinc-400 text-xs font-medium max-w-xl leading-relaxed">
              Welcome back to the portal administrator console. Below is the active node deployment dashboard. Database sync, SSL authorization, and key managers are functioning optimally.
            </p>
          </div>
          <div className="relative z-10 flex gap-3 shrink-0">
            <button className="px-4 py-2 border border-white/5 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer">
              System Logs
            </button>
            <button className="px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer">
              Cluster Settings
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <article
                key={idx}
                className="rounded-3xl p-6 glass-card relative overflow-hidden flex flex-col justify-between h-40"
              >
                <div className={`absolute inset-0 ${stat.bg} opacity-60 pointer-events-none`} />
                <div className="grain-overlay" />
                <div className="relative z-10 flex items-start justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">{stat.label}</span>
                  <div className={`p-2.5 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="relative z-10 mt-auto">
                  <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-1">{stat.change}</p>
                </div>
              </article>
            );
          })}
        </section>

        {/* Config & Security Panels */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User management panel */}
          <div className="lg:col-span-2 rounded-3xl p-6 glass-card relative overflow-hidden flex flex-col justify-between">
            <div className="absolute inset-0 bg-mesh-cyan opacity-40 pointer-events-none" />
            <div className="grain-overlay" />
            <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">User Registrations</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Manage portal member authorization roles</p>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-white/10 hover:border-cyan-500/20 text-[10px] font-bold text-white rounded-xl transition-colors cursor-pointer">
                View All Users
              </button>
            </div>
            
            <div className="relative z-10 flex-1 overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider border-b border-white/5">
                    <th className="py-2.5 font-bold">User</th>
                    <th className="py-2.5 font-bold">Role</th>
                    <th className="py-2.5 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentUsers.map((member, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3">
                        <div className="font-semibold text-white">{member.name}</div>
                        <div className="text-[10px] text-zinc-500">{member.email}</div>
                      </td>
                      <td className="py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          member.role === "teacher" 
                            ? "bg-violet-500/10 border border-violet-500/20 text-violet-400" 
                            : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                          member.status === "Active" ? "bg-emerald-400 animate-pulse" : "bg-orange-400"
                        }`} />
                        <span className="text-[10px] font-semibold text-zinc-400">{member.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick config options */}
          <div className="space-y-6">
            <div className="rounded-3xl p-6 glass-card relative overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-mesh-orange opacity-40 pointer-events-none" />
              <div className="grain-overlay" />
              <div className="relative z-10 flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Key Vault</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">SSL Credentials & Tokens</p>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <Key className="w-4 h-4" />
                </div>
              </div>
              <p className="relative z-10 text-xs text-zinc-400 leading-relaxed mb-4">
                Manage token auth secrets, SSO client links, and row security rules directly.
              </p>
              <button className="relative z-10 w-full py-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold hover:bg-orange-500/20 transition-all cursor-pointer">
                Manage Credentials
              </button>
            </div>

            <div className="rounded-3xl p-6 glass-card relative overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-mesh-violet opacity-45 pointer-events-none" />
              <div className="grain-overlay" />
              <div className="relative z-10 flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Core Database</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Postgres Seeding & Stats</p>
                </div>
                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <p className="relative z-10 text-xs text-zinc-400 leading-relaxed mb-4">
                Verify row counts, run queries, and monitor active connection pooling statistics.
              </p>
              <button className="relative z-10 w-full py-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-bold hover:bg-violet-500/20 transition-all cursor-pointer">
                Monitor Database
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
