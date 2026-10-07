"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Activity, CheckCircle2, Award, BookOpen, Star, RefreshCw, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ActivityPulseEvent } from "@/lib/telemetry";

const INITIAL_EVENTS: ActivityPulseEvent[] = [
  {
    id: "act-init-1",
    type: "enrollment",
    title: "Enrolled in Fullstack Next.js & React 19",
    actor: "Alex C.",
    timestamp: "2026-10-07T12:00:00.000Z",
  },
  {
    id: "act-init-2",
    type: "lesson_complete",
    title: "Completed Server Components & Telemetry",
    actor: "Sarah M.",
    timestamp: "2026-10-07T11:50:00.000Z",
  },
  {
    id: "act-init-3",
    type: "certificate",
    title: "Earned Certified Professional Badge",
    actor: "Liam P.",
    timestamp: "2026-10-07T11:35:00.000Z",
  },
];

function formatTimeAgo(isoString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 15) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  } catch {
    return "Recently";
  }
}

export default function LiveActivityPulse() {
  const [events, setEvents] = useState<ActivityPulseEvent[]>(INITIAL_EVENTS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchLiveFeed = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/telemetry/activity", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.feed && Array.isArray(data.feed)) {
          setEvents(data.feed);
          setLastSync(new Date());
        }
      }
    } catch {
      // Retain existing events on transient network failure
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch scheduled asynchronously
    const timer = setTimeout(() => {
      void fetchLiveFeed();
    }, 0);

    // 1. Supabase Realtime Broadcast channel
    const supabase = createClient();
    const channel = supabase
      .channel("aura-live-telemetry")
      .on("broadcast", { event: "new_activity" }, ({ payload }) => {
        if (payload && (payload as ActivityPulseEvent).id) {
          const item = payload as ActivityPulseEvent;
          setEvents((curr) => [item, ...curr.filter((e) => e.id !== item.id)].slice(0, 10));
          setLastSync(new Date());
        }
      })
      .subscribe();

    // 2. Active Tab Real-time Polling Interval (every 6 seconds when document is visible)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void fetchLiveFeed();
      }
    }, 6000);

    // 3. Clock tick every 10s to keep relative timestamps dynamic
    const clockInterval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      clearInterval(clockInterval);
      void supabase.removeChannel(channel);
    };
  }, [fetchLiveFeed]);

  function getIcon(type: ActivityPulseEvent["type"]) {
    switch (type) {
      case "certificate":
        return <Award className="h-3.5 w-3.5 text-amber-400" />;
      case "lesson_complete":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
      case "quiz_pass":
      case "review":
        return <Star className="h-3.5 w-3.5 text-cyan-400" />;
      default:
        return <BookOpen className="h-3.5 w-3.5 text-violet-400" />;
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 p-6 shadow-2xl backdrop-blur-2xl">
      <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-cyan-600/15 blur-3xl" />
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
            <Activity className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-wide">Community Pulse</h3>
            <p className="text-[11px] text-zinc-400">Real-time learning events across AURA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-[10px] font-bold text-cyan-300">
            <Radio className="h-3 w-3 text-cyan-400 animate-pulse" /> Live Stream
          </span>
          <button
            type="button"
            onClick={() => void fetchLiveFeed()}
            disabled={isSyncing}
            title="Refresh stream"
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {events.slice(0, 4).map((evt, idx) => (
          <div
            key={evt.id}
            className="group flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04] hover:border-cyan-500/20"
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform">
              {getIcon(evt.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  {evt.actor}
                  {idx === 0 && (
                    <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-extrabold text-emerald-300">
                      NEW
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-zinc-500 shrink-0 font-medium" suppressHydrationWarning>
                  {isMounted ? formatTimeAgo(evt.timestamp) : "Recently"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 truncate mt-0.5">{evt.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          Active WebSocket & telemetry stream
        </span>
        <span suppressHydrationWarning>
          {isMounted
            ? `Synced ${lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
            : "Active telemetry stream"}
        </span>
      </div>
    </div>
  );
}
