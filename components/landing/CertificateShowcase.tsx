"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Download,
  Check,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { SpotlightCard } from "@/components/motion";

const TRACKS = [
  {
    id: "fullstack",
    title: "Fullstack Architecture & Distributed Systems",
    instructor: "Dr. Marcus Chen, Principal Architect",
    certId: "AURA-CERT-9481-2026",
    issueDate: "October 2026",
    skills: ["Next.js 16 App Router", "Server Components", "PostgreSQL RLS", "System Design"],
  },
  {
    id: "ai-agents",
    title: "Autonomous AI Agents & LLM Orchestration",
    instructor: "Elena Rostova, Senior AI Researcher",
    certId: "AURA-CERT-8120-2026",
    issueDate: "October 2026",
    skills: ["Agentic Loops", "Tool Calling", "Vector Embeddings", "RAG Pipelines"],
  },
  {
    id: "database",
    title: "Production PostgreSQL & Advanced Modeling",
    instructor: "Dr. Marcus Chen & Database SIG",
    certId: "AURA-CERT-7209-2026",
    issueDate: "October 2026",
    skills: ["EXPLAIN ANALYZE", "Partition Pruning", "Row Level Security", "Audit Triggers"],
  },
];

export default function CertificateShowcase() {
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [learnerName, setLearnerName] = useState("Alex Rivera");
  const [copied, setCopied] = useState(false);
  const [verifiedState, setVerifiedState] = useState(false);

  const track = TRACKS[selectedTrackIndex];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://aura.edu/verify/${track.certId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVerify = () => {
    setVerifiedState(true);
    setTimeout(() => setVerifiedState(false), 3000);
  };

  return (
    <section id="certificates" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
        {/* Left Column: Context & Proof Points */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">
            <Award className="h-3 w-3" />
            Accredited Credentials
          </span>

          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.08]">
            Verifiable Certificates.{" "}
            <span className="bg-gradient-to-r from-violet-300 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
              Recognized Worldwide.
            </span>
          </h2>

          <p className="mt-5 text-sm sm:text-base leading-relaxed text-zinc-400">
            Every course completion generates a tamper-proof digital credential backed by cryptographic verification. Showcase verified mastery to hiring managers and add directly to your LinkedIn profile.
          </p>

          {/* Interactive customization controls */}
          <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.02] p-5 backdrop-blur-md">
            <label className="block text-xs font-bold text-zinc-300">
              Customize preview with your name:
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={learnerName}
                onChange={(e) => setLearnerName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs font-bold text-white transition focus:border-violet-400 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 self-center mr-1">
                Select Track:
              </span>
              {TRACKS.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrackIndex(idx)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                    selectedTrackIndex === idx
                      ? "bg-violet-500/20 text-violet-300 border border-violet-400/30"
                      : "bg-white/[0.04] text-zinc-400 hover:text-white"
                  }`}
                >
                  {t.id === "fullstack" ? "Fullstack Systems" : t.id === "ai-agents" ? "AI Agents" : "PostgreSQL"}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome highlights (Coursera benchmark metrics) */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <TrendingUp className="h-4 w-4" />
                <span>89% Outcome</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Graduates reporting promotions, job offers, or raises within 6 months.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>100% Verifiable</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Unique verification URL and cryptographic checksum for employers.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: High-Fidelity Holographic Digital Certificate Mockup */}
        <div className="relative">
          {/* Ambient colorful backlight */}
          <div className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-violet-600/20 via-cyan-500/10 to-indigo-600/20 blur-2xl pointer-events-none" />

          <motion.div
            layout
            className="relative rounded-3xl border border-white/15 bg-gradient-to-br from-[#0d0d12] via-[#09090c] to-[#040406] p-6 sm:p-9 shadow-2xl shadow-violet-950/40"
          >
            {/* Top Certificate Border Accents */}
            <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-violet-500 via-cyan-400 to-indigo-500" />

            {/* Inner Border Frame */}
            <div className="relative rounded-2xl border border-white/10 p-6 sm:p-8 bg-black/40">
              {/* Header with Seal */}
              <div className="flex items-center justify-between pb-6 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/30">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-widest text-white uppercase block">
                      AURA Institute of Technology
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ACCREDITED CREDENTIAL • VERIFIED RECORD
                    </span>
                  </div>
                </div>

                {/* Holographic Seal badge */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-400/40 bg-gradient-to-br from-amber-400/20 via-yellow-500/10 to-amber-600/20 text-amber-300 shadow-lg shadow-amber-400/10">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              {/* Certificate Body */}
              <div className="mt-8 text-center">
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  This certifies that
                </p>
                <h3 className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-tight underline decoration-violet-500/40 decoration-2 underline-offset-8">
                  {learnerName || "Your Full Name"}
                </h3>
                <p className="mt-4 text-xs text-zinc-400">
                  has successfully mastered the coursework and comprehensive examinations for
                </p>
                <p className="mt-2 text-base sm:text-lg font-black text-cyan-300">
                  {track.title}
                </p>
              </div>

              {/* Skills Chips */}
              <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                {track.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-white/[0.04] border border-white/8 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Signatures & Verification ID footer */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/8 text-left">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Lead Instructor</p>
                  <p className="text-xs font-bold text-zinc-200 mt-0.5 font-serif italic">{track.instructor}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Credential ID</p>
                  <p className="text-[11px] font-mono text-cyan-400 mt-0.5 font-bold">{track.certId}</p>
                </div>
              </div>
            </div>

            {/* Live Interactive Actions bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVerify}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  {verifiedState ? "✓ Authenticated on Ledger" : "Verify Authenticity"}
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied Link!" : "Copy Verification URL"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/25 hover:brightness-110 active:scale-95 transition"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.37 9.74v-8.37H5.09v8.37h2.74z" />
                  </svg>
                  Add to LinkedIn
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
