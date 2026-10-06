"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Trophy, Medal, Sparkles, Zap, RefreshCw, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/lib/telemetry";

export default function LiveLeaderboardCard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([
    { rank: 1, userId: "u-1", name: "David Kim", xp: 1250 },
    { rank: 2, userId: "u-2", name: "Elena Rostova", xp: 980 },
    { rank: 3, userId: "u-3", name: "Marcus Vance", xp: 840 },
    { rank: 4, userId: "u-4", name: "Chloe Dupont", xp: 720 },
    { rank: 5, userId: "u-5", name: "Aria Thorne", xp: 610 },
  ]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/telemetry/leaderboard", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.leaderboard && Array.isArray(data.leaderboard)) {
          setEntries(data.leaderboard);
          setLastSync(new Date());
        }
      }
    } catch {
      // Retain existing entries on transient failure
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    void fetchLeaderboard();

    // 1. Supabase Realtime Broadcast channel
    const supabase = createClient();
    const channel = supabase
      .channel("aura-live-telemetry")
      .on("broadcast", { event: "leaderboard_update" }, () => {
        void fetchLeaderboard();
      })
      .subscribe();

    // 2. Active Tab Real-time Polling Interval (every 8 seconds when document is visible)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void fetchLeaderboard();
      }
    }, 8000);

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-2xl backdrop-blur-2xl">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500/20 to-violet-500/20 text-amber-300 border border-amber-500/30 shadow-inner">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-wide">Weekly Champions</h3>
            <p className="text-[11px] text-zinc-400">Live learner leaderboard & XP telemetry</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-black text-emerald-400">
            <Radio className="h-3 w-3 text-emerald-400 animate-pulse" /> Live
          </span>
          <button
            type="button"
            onClick={() => void fetchLeaderboard()}
            disabled={isSyncing}
            title="Refresh leaderboard"
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {entries.map((user) => (
          <div
            key={user.userId}
            className={`flex items-center justify-between rounded-2xl px-3.5 py-2.5 transition-all duration-300 border ${
              user.rank === 1
                ? "bg-amber-500/[0.08] border-amber-500/30 text-amber-200 shadow-sm"
                : user.rank === 2
                ? "bg-slate-300/[0.05] border-slate-300/20 text-zinc-200"
                : user.rank === 3
                ? "bg-amber-700/[0.05] border-amber-700/20 text-zinc-300"
                : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-xs font-black">
                {user.rank === 1 ? (
                  <Medal className="h-4 w-4 text-amber-400" />
                ) : user.rank === 2 ? (
                  <Medal className="h-4 w-4 text-slate-300" />
                ) : user.rank === 3 ? (
                  <Medal className="h-4 w-4 text-amber-600" />
                ) : (
                  <span className="text-zinc-500">#{user.rank}</span>
                )}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-snug flex items-center gap-1">
                  {user.name}
                  {user.rank === 1 && <Sparkles className="h-2.5 w-2.5 text-amber-400 animate-pulse" />}
                </span>
                <span className="text-[10px] text-zinc-500">Rank #{user.rank} this week</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 text-xs font-black text-violet-300">
              <Zap className="h-3 w-3 text-cyan-400" />
              <span>{user.xp.toLocaleString()} XP</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          Realtime XP calculations
        </span>
        <span>Updated {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
      </div>
    </div>
  );
}
