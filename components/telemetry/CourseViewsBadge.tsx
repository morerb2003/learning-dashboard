"use client";

import React, { useEffect, useState } from "react";
import { Eye, Flame } from "lucide-react";

interface CourseViewsBadgeProps {
  courseId: string;
  initialTotal?: number;
}

export default function CourseViewsBadge({
  courseId,
  initialTotal = 142,
}: CourseViewsBadgeProps) {
  const [totalViews, setTotalViews] = useState(initialTotal);

  useEffect(() => {
    // Record view asynchronously on mount
    fetch(`/api/telemetry/courses/${courseId}/views`, { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.stats?.total) {
          setTotalViews(data.stats.total);
        }
      })
      .catch(() => {
        // Silently retain initial baseline on network issues
      });
  }, [courseId]);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 shadow-sm backdrop-blur-md">
      <Eye className="h-3.5 w-3.5 text-violet-400" />
      <span>{totalViews.toLocaleString()} views</span>
      {totalViews > 100 && (
        <span className="flex items-center gap-0.5 text-amber-400 text-[10px] font-bold">
          <Flame className="h-3 w-3 fill-amber-400" /> Trending
        </span>
      )}
    </div>
  );
}
