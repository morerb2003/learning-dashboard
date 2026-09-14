"use client";

import React from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsProps<T>) {
  return (
    <div
      className={`flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-2xl overflow-x-auto no-scrollbar ${className}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap
              ${
                isActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/25 border border-violet-400/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
              }
            `}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? "bg-white/20 text-white" : "bg-white/10 text-zinc-400"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
