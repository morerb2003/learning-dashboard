"use client";

import dynamic from "next/dynamic";

const DynamicTeacherAnalyticsChart = dynamic(
  () => import("./TeacherAnalyticsChart"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse flex flex-col justify-center items-center text-xs font-semibold text-zinc-500">
        Loading instructor performance analytics...
      </div>
    ),
  }
);

export default DynamicTeacherAnalyticsChart;
