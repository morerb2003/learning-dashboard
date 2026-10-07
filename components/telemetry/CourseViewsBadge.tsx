"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Eye, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CourseViewsBadgeProps {
  courseId: string;
  initialTotal?: number;
}

export default function CourseViewsBadge({
  courseId,
  initialTotal = 142,
}: CourseViewsBadgeProps) {
  const [totalViews, setTotalViews] = useState(initialTotal);
  const [hasBumped, setHasBumped] = useState(false);

  const fetchViews = useCallback(async () => {
    try {
      const res = await fetch(`/api/telemetry/courses/${courseId}/views`);
      if (res.ok) {
        const data = await res.json();
        if (data?.stats?.total && data.stats.total !== totalViews) {
          setTotalViews(data.stats.total);
          setHasBumped(true);
          setTimeout(() => setHasBumped(false), 2000);
        }
      }
    } catch {
      // Retain existing count
    }
  }, [courseId, totalViews]);

  useEffect(() => {
    // 1. Record view asynchronously on mount
    fetch(`/api/telemetry/courses/${courseId}/views`, { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.stats?.total) {
          setTotalViews(data.stats.total);
        }
      })
      .catch(() => {});

    // 2. Real-time broadcast channel
    const supabase = createClient();
    const channel = supabase
      .channel(`course-views:${courseId}`)
      .on("broadcast", { event: "new_view" }, ({ payload }) => {
        if (payload?.total) {
          setTotalViews(payload.total);
          setHasBumped(true);
          setTimeout(() => setHasBumped(false), 2000);
        }
      })
      .subscribe();

    // 3. Periodic visibility-aware sync every 15s
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void fetchViews();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [courseId, fetchViews]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-md transition-all duration-300 ${
        hasBumped
          ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200 scale-105"
          : "border-violet-500/20 bg-violet-500/10 text-violet-300"
      }`}
    >
      <Eye className={`h-3.5 w-3.5 ${hasBumped ? "text-emerald-300 animate-pulse" : "text-violet-400"}`} />
      <span suppressHydrationWarning>{totalViews.toLocaleString()} views</span>
      {totalViews > 100 && (
        <span className="flex items-center gap-0.5 text-amber-400 text-[10px] font-bold">
          <Flame className="h-3 w-3 fill-amber-400" /> Trending
        </span>
      )}
    </div>
  );
}
