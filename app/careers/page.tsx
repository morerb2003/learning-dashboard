import React from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Search,
  Award,
  TrendingUp,
  Bot,
  FileText,
  MapPin,
  DollarSign,
  GraduationCap,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import StudentHeader from "@/components/layout/StudentHeader";

export const dynamic = "force-dynamic";

const FEATURED_JOBS = [
  {
    id: "job-1",
    title: "Senior Fullstack Engineer (Next.js & Cloud)",
    company: "Vercel Partner Network",
    logoText: "▲",
    location: "Remote (US / EU)",
    salary: "$140,000 - $180,000",
    tags: ["Next.js", "React 19", "TypeScript", "PostgreSQL"],
    matchScore: 96,
    hiringType: "Direct Interview",
  },
  {
    id: "job-2",
    title: "AI Solutions & Edge Systems Architect",
    company: "Anthropic Ecosystem",
    logoText: "⚡",
    location: "San Francisco, CA / Remote",
    salary: "$165,000 - $210,000",
    tags: ["LLM Agents", "Python", "Vector DBs", "Redis"],
    matchScore: 92,
    hiringType: "Fast-Track Referral",
  },
  {
    id: "job-3",
    title: "Frontend Platform Engineer",
    company: "Stripe Integrations Lab",
    logoText: "💳",
    location: "Remote / Hybrid",
    salary: "$130,000 - $165,000",
    tags: ["Design Systems", "Web Performance", "TailwindCSS"],
    matchScore: 89,
    hiringType: "Direct Referral",
  },
  {
    id: "job-4",
    title: "Cloud Infrastructure & Telemetry Specialist",
    company: "Supabase Certified Guild",
    logoText: "⚡",
    location: "Remote Global",
    salary: "$120,000 - $150,000",
    tags: ["Database Hardening", "Docker", "Edge Functions"],
    matchScore: 85,
    hiringType: "Priority Hiring",
  },
];

const CAREER_METRICS = [
  { label: "Placement Readiness", value: "94%", detail: "Top 5% in cohort", icon: Award, color: "text-emerald-400" },
  { label: "Verified Skill Badges", value: "8 / 10", detail: "TypeScript & Cloud validated", icon: ShieldCheck, color: "text-indigo-400" },
  { label: "Active Partner Roles", value: "142", detail: "Updated 10m ago", icon: Briefcase, color: "text-cyan-400" },
  { label: "Mock AI Interviews", value: "12 Passed", detail: "System design & coding", icon: Bot, color: "text-violet-400" },
];

export default async function CareersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/careers");

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100 flex flex-col">
      {/* Header with Role Switching and Live Telemetry */}
      <StudentHeader
        title="Careers & Placements"
        subtitle="Stitch Partner Network & Direct Referrals"
        user={{
          full_name: user.full_name || "Scholar",
          email: user.email || "",
          role: user.role,
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl modern-card p-6 md:p-10">
          <div className="absolute inset-0 bg-mesh-violet opacity-30 pointer-events-none" />
          <div className="absolute inset-0 bg-mesh-cyan opacity-20 pointer-events-none mix-blend-screen" />
          <div className="grain-overlay" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Stitch Careers & Placements Suite
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white font-plus-jakarta leading-tight">
                Launch Your Career with Direct Partner Referrals
              </h1>
              <p className="text-sm md:text-base leading-relaxed text-zinc-400">
                Bridge the gap between course completions and top engineering roles. Get automated AI resume reviews, portfolio validation, and priority interview referrals.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <Briefcase className="w-4 h-4" />
                  View All Open Positions
                </Link>
                <Link
                  href="/learning"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-[#0b0f19] hover:bg-white/[0.04] text-zinc-300 font-bold text-xs transition-colors"
                >
                  <Bot className="w-4 h-4 text-cyan-400" />
                  AI Mock Interview Studio
                </Link>
              </div>
            </div>

            {/* Quick Readiness Dial */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f19]/90 p-6 flex flex-col items-center text-center space-y-3 min-w-[260px]">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 p-1 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-[#030712] rounded-full flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white font-plus-jakarta">94%</span>
                  <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">READY</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Verified Scholar</h3>
                <p className="text-[11px] text-zinc-400">All Core Modules Passed</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Tier 1 Candidate
              </span>
            </div>
          </div>
        </section>

        {/* Career Telemetry Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CAREER_METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="relative overflow-hidden rounded-2xl modern-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{metric.label}</span>
                  <div className={`p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] ${metric.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-white font-plus-jakarta">{metric.value}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{metric.detail}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Featured Job Postings */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-plus-jakarta flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Featured Partner Opportunities
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Pre-screened roles matched to your course progress and badges</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Filter by Match:</span>
              <span className="px-3 py-1 rounded-lg text-xs font-bold border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                &gt;85% Match
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {FEATURED_JOBS.map((job) => (
              <article
                key={job.id}
                className="rounded-2xl modern-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-white/[0.14]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xl font-bold text-indigo-400 flex-shrink-0">
                    {job.logoText}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white hover:text-indigo-300 transition-colors cursor-pointer">
                        {job.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                        {job.hiringType}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <DollarSign className="w-3.5 h-3.5" />
                        {job.salary}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.03] border border-white/[0.06] text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 flex-shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Match Score</span>
                    <span className="text-lg font-black text-emerald-400 font-plus-jakarta">{job.matchScore}% Match</span>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all">
                    Request Referral
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* AI Resume and Interview Prep Banner */}
        <section className="rounded-3xl modern-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-indigo-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-indigo-500/25">
              <Bot className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-plus-jakarta">
                Want AI feedback on your resume & portfolio?
              </h3>
              <p className="text-xs text-zinc-400">
                Run our Gemini 2.5 flash analysis against 50+ hiring rubrics to score your project experience.
              </p>
            </div>
          </div>
          <button className="px-5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-colors">
            <FileText className="w-4 h-4 text-cyan-400" />
            Analyze Portfolio
          </button>
        </section>
      </main>
    </div>
  );
}
