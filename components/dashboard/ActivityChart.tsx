"use client";

import React, { useState, useEffect } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid 
} from "recharts";

// Mock study data
const studyData = [
  { day: "Mon", hours: 2.5, modules: 2 },
  { day: "Tue", hours: 4.2, modules: 4 },
  { day: "Wed", hours: 3.0, modules: 1 },
  { day: "Thu", hours: 5.5, modules: 5 },
  { day: "Fri", hours: 2.0, modules: 2 },
  { day: "Sat", hours: 6.8, modules: 6 },
  { day: "Sun", hours: 4.8, modules: 3 },
];

export default function ActivityChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full min-h-[220px] flex items-center justify-center text-zinc-500 text-sm">
        Loading chart analytics...
      </div>
    );
  }

  // Custom tooltips matching the dashboard glass aesthetics
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card px-4 py-3 rounded-2xl border border-white/10 shadow-2xl relative z-50">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">{payload[0].payload.day}</p>
          <div className="mt-1 space-y-0.5">
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{payload[0].value} hrs</span>
              <span className="text-zinc-500 font-normal">focused</span>
            </p>
            <p className="text-[10px] text-zinc-400">
              Completed {payload[0].payload.modules} modules
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[220px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-violet-400">Study Velocity</span>
          <h4 className="text-sm font-bold text-white tracking-wide mt-0.5">Focus Hours</h4>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-semibold text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
            <span>Target (3h/day)</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-[180px] min-h-[180px] relative">
        <ResponsiveContainer width="99%" height="100%">
          <AreaChart
            data={studyData}
            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(255, 255, 255, 0.04)" 
            />

            <XAxis 
              dataKey="day" 
              stroke="#52525b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={8}
            />

            <YAxis 
              stroke="#52525b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dx={-8}
            />

            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: 'rgba(139, 92, 246, 0.15)', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="hours"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorHours)"
              activeDot={{ 
                r: 4, 
                stroke: '#8b5cf6', 
                strokeWidth: 2, 
                fill: '#030303' 
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
