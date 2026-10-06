"use client";

import React, { useEffect, useState } from "react";
import { Activity, CheckCircle2, Award, BookOpen, Star } from "lucide-react";
import type { ActivityPulseEvent } from "@/lib/telemetry";

const INITIAL_EVENTS: ActivityPulseEvent[] = [
  {
    id: "act-init-1",
    type: "enrollment",
    title: "Enrolled in Fullstack Next.js & React 19",
    actor: "Alex C.",
    timestamp: "8m ago",
  },
  {
    id: "act-init-2",
    type: "lesson_complete",
    title: "Completed Server Components & Telemetry",
    actor: "Sarah M.",
    timestamp: "18m ago",
  },
  {
    id: "act-init-3",
    type: "certificate",
    title: "Earned Certified Professional Badge",
    actor: "Liam P.",
    timestamp: "35m ago",
  },
];

export default function LiveActivityPulse() {
  const [events, setEvents] = useState<ActivityPulseEvent[]>(INITIAL_EVENTS);

  useEffect(() => {
    fetch("/api/telemetry/activity")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.feed && Array.isArray(data.feed)) {
          setEvents(data.feed);
        }
      })
      .catch(() => {});
  }, []);

  function getIcon(type: ActivityPulseEvent["type"]) {
    switch (type) {
      case "certificate":
        return <Award className="h-3.5 w-3.5 text-amber-400" />;
      case "lesson_complete":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-wide">Community Pulse</h3>
            <p className="text-[11px] text-zinc-400">Real-time learning events across AURA</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-zinc-500">Live Telemetry</span>
      </div>

      <div className="mt-4 space-y-3">
        {events.slice(0, 4).map((evt) => (
          <div
            key={evt.id}
            className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.04]"
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              {getIcon(evt.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white truncate">{evt.actor}</span>
                <span className="text-[10px] text-zinc-500 shrink-0">Just now</span>
              </div>
              <p className="text-[11px] text-zinc-300 truncate mt-0.5">{evt.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
