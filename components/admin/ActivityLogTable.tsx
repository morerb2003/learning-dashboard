"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, Layers, ChevronDown, ChevronUp, Calendar, RefreshCw } from "lucide-react";

export interface AuditLog {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
  actor?: {
    full_name: string | null;
    email: string | null;
    role: string | null;
  } | null;
}

interface ActivityLogTableProps {
  initialLogs: AuditLog[];
}

export default function ActivityLogTable({ initialLogs }: ActivityLogTableProps) {
  const [logs] = useState<AuditLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [expandedLogIds, setExpandedLogIds] = useState<Record<number, boolean>>({});

  const toggleExpandLog = (id: number) => {
    setExpandedLogIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReset = () => {
    setSearchQuery("");
    setActionFilter("all");
    setEntityFilter("all");
    setDateFilter("all");
    setSortOrder("newest");
    setExpandedLogIds({});
  };

  // Dynamic entity types from actual logs to populate dropdown
  const entityTypes = useMemo(() => {
    const types = new Set<string>();
    logs.forEach((log) => {
      if (log.entity_type) types.add(log.entity_type);
    });
    return Array.from(types).sort();
  }, [logs]);

  // Actions present in the logs
  const actions = useMemo(() => {
    const acts = new Set<string>();
    logs.forEach((log) => {
      if (log.action) acts.add(log.action.toLowerCase());
    });
    return Array.from(acts).sort();
  }, [logs]);

  // Filter & Sort logs
  const filteredLogs = useMemo(() => {
    let result = logs.filter((log) => {
      // 1. Search Query
      const actorName = log.actor?.full_name || "";
      const actorEmail = log.actor?.email || "";
      const entityId = log.entity_id || "";
      const actionText = log.action || "";
      const entityType = log.entity_type || "";
      const matchesSearch =
        searchQuery.trim() === "" ||
        actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entityType.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Action Filter
      const matchesAction =
        actionFilter === "all" || log.action.toLowerCase() === actionFilter;

      // 3. Entity Filter
      const matchesEntity =
        entityFilter === "all" || log.entity_type === entityFilter;

      // 4. Date Filter
      let matchesDate = true;
      if (dateFilter !== "all") {
        const logDate = new Date(log.created_at);
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (dateFilter === "today") {
          matchesDate = logDate >= startOfDay;
        } else if (dateFilter === "yesterday") {
          const yesterdayStart = new Date(startOfDay);
          yesterdayStart.setDate(yesterdayStart.getDate() - 1);
          matchesDate = logDate >= yesterdayStart && logDate < startOfDay;
        } else if (dateFilter === "week") {
          const sevenDaysAgo = new Date(startOfDay);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          matchesDate = logDate >= sevenDaysAgo;
        } else if (dateFilter === "month") {
          const thirtyDaysAgo = new Date(startOfDay);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          matchesDate = logDate >= thirtyDaysAgo;
        }
      }

      return matchesSearch && matchesAction && matchesEntity && matchesDate;
    });

    // Sort order
    return result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [logs, searchQuery, actionFilter, entityFilter, dateFilter, sortOrder]);

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  }

  function formatValue(val: any): string {
    if (val === null || val === undefined) return "null";
    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  }

  // Maps entities to visual friendly icons
  function renderEntityLabel(entity: string) {
    const map: Record<string, string> = {
      profiles: "👤 Profile",
      courses: "📚 Course",
      lessons: "📖 Lesson",
      course_discussions: "💬 Discussion",
      discussion_replies: "💬 Reply",
      enrollments: "🎓 Enrollment",
      course_reviews: "⭐ Review",
      direct_messages: "✉️ Message",
      moderation_flags: "🚩 Moderation",
      platform_announcements: "📢 Announcement",
      attempts: "📝 Quiz Attempt",
      submissions: "📥 Assignment Submission",
      quizzes: "❓ Quiz",
      assignments: "📋 Assignment",
    };

    const label = map[entity] || `⚙️ ${entity}`;
    return <span className="font-bold text-zinc-300">{label}</span>;
  }

  function renderDetailsDiff(log: AuditLog) {
    const details = log.details;
    if (!details) return <span className="text-zinc-600">No payload</span>;
    const oldObj = details.old;
    const newObj = details.new;

    // Check if it's an update change
    if (oldObj && newObj) {
      // Find modified keys
      const diffKeys: string[] = [];
      const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

      for (const key of keys) {
        if (key === "updated_at" || key === "created_at" || key === "id") continue;
        const oldVal = oldObj[key];
        const newVal = newObj[key];

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          diffKeys.push(key);
        }
      }

      if (diffKeys.length === 0) {
        return <span className="text-zinc-500 italic">No visible property changes</span>;
      }

      const isExpanded = expandedLogIds[log.id] || false;

      return (
        <div className="space-y-2">
          {/* Collapsed view header */}
          <button
            onClick={() => toggleExpandLog(log.id)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-violet-300 hover:bg-white/10 hover:text-white cursor-pointer select-none"
          >
            Updated {log.entity_type} &bull; {diffKeys.length} field{diffKeys.length > 1 ? "s" : ""} changed
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Expanded visual diff panel */}
          {isExpanded && (
            <div className="mt-2 space-y-3 rounded-2xl border border-white/5 bg-zinc-950/40 p-4 max-w-lg">
              {diffKeys.map((key) => {
                const oldVal = oldObj[key];
                const newVal = newObj[key];

                return (
                  <div key={key} className="space-y-1 text-[10px]">
                    <p className="font-bold text-zinc-400 uppercase tracking-wide text-[9px]">{key}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_20px_1fr] items-center gap-2 font-mono">
                      {/* Old Value (Red Diff) */}
                      <div className="rounded-lg border border-rose-500/15 bg-rose-500/5 px-2 py-1 text-rose-300 truncate">
                        <span className="text-rose-500 font-bold mr-1">-</span>
                        {formatValue(oldVal)}
                      </div>
                      <span className="text-zinc-500 text-center font-bold">➔</span>
                      {/* New Value (Green Diff) */}
                      <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-2 py-1 text-emerald-300 truncate">
                        <span className="text-emerald-500 font-bold mr-1">+</span>
                        {formatValue(newVal)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Insert Diff payload
    if (newObj) {
      const interestingKeys = ["title", "name", "full_name", "email", "role", "status"];
      const info = interestingKeys
        .filter((key) => newObj[key] !== undefined)
        .map((key) => `${key}: ${formatValue(newObj[key])}`);

      return (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-emerald-400 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Created record
          </p>
          {info.length > 0 && (
            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] p-2.5 max-w-sm text-[9px] font-mono text-zinc-400 break-words leading-normal">
              {info.map((inf, i) => (
                <p key={i}>
                  <span className="text-emerald-400 font-bold">+</span> {inf}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Delete Diff payload
    if (oldObj) {
      const interestingKeys = ["title", "name", "full_name", "email", "role"];
      const info = interestingKeys
        .filter((key) => oldObj[key] !== undefined)
        .map((key) => `${key}: ${formatValue(oldObj[key])}`);

      return (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-rose-400 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Deleted record
          </p>
          {info.length > 0 && (
            <div className="rounded-xl border border-rose-500/10 bg-rose-500/[0.02] p-2.5 max-w-sm text-[9px] font-mono text-zinc-500 break-words leading-normal">
              {info.map((inf, i) => (
                <p key={i}>
                  <span className="text-rose-500 font-bold">-</span> {inf}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span className="text-zinc-600 font-mono text-[9px] break-all">{JSON.stringify(details)}</span>;
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters Panel */}
      <div className="flex flex-col gap-4 bg-zinc-900/30 backdrop-blur-xl border border-white/5 p-5 rounded-3xl">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Main search bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by actor, entity ID, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-2 pl-11 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-2 px-3 text-xs font-semibold text-zinc-300 outline-none focus:border-violet-500/50"
            >
              <option value="all">All Actions</option>
              {actions.map((act) => (
                <option key={act} value={act}>
                  {act.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Filter */}
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-2 px-3 text-xs font-semibold text-zinc-300 outline-none focus:border-violet-500/50"
            >
              <option value="all">All Entities</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl py-2 px-3 text-xs font-semibold text-zinc-300 outline-none focus:border-violet-500/50"
            >
              <option value="all">Any Date</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
            </select>
          </div>
        </div>

        {/* Sorting / Reset actions */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-zinc-950/40 border border-white/5 rounded-xl py-1 px-3 text-[10px] font-semibold text-zinc-300 outline-none focus:border-violet-500/50"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reset Filters
          </button>
        </div>
      </div>

      {/* Main logs table */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-white/10 text-[9px] uppercase tracking-widest text-zinc-500 bg-white/[0.01]">
              <tr>
                <th className="px-5 py-4">Time</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Entity Type</th>
                <th className="px-5 py-4">Entity ID</th>
                <th className="px-5 py-4">Actor</th>
                <th className="px-5 py-4">Details Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const actorName = log.actor?.full_name || "";
                  const actorEmail = log.actor?.email || "";
                  const actorRole = log.actor?.role || "system";
                  const displayName = actorName || actorEmail.split("@")[0] || "system";

                  let actionColor = "border-white/10 bg-white/5 text-zinc-400";
                  if (log.action.toLowerCase() === "insert") {
                    actionColor = "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
                  } else if (log.action.toLowerCase() === "delete") {
                    actionColor = "border-rose-500/20 bg-rose-500/10 text-rose-300";
                  } else if (log.action.toLowerCase() === "update") {
                    actionColor = "border-violet-500/20 bg-violet-500/10 text-violet-300";
                  } else if (log.action.toLowerCase().includes("login")) {
                    actionColor = "border-sky-500/20 bg-sky-500/10 text-sky-300";
                  }

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                      {/* Time */}
                      <td className="px-5 py-4 text-zinc-500 font-semibold whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      {/* Action Badges */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${actionColor}`}>
                          {log.action}
                        </span>
                      </td>
                      {/* Entity Label (with icons) */}
                      <td className="px-5 py-4 whitespace-nowrap">{renderEntityLabel(log.entity_type)}</td>
                      {/* Entity ID */}
                      <td className="px-5 py-4 text-zinc-500 font-mono text-[10px] break-all max-w-[120px]">
                        {log.entity_id || "-"}
                      </td>
                      {/* Actor Card */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5 min-w-[160px]">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center font-black text-cyan-300 text-xs">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{displayName}</p>
                            {actorEmail && <p className="text-[9px] text-zinc-500 mt-0.5">{actorEmail}</p>}
                            <span className="inline-block mt-1 text-[8px] font-bold uppercase tracking-wider text-zinc-400 bg-white/5 border border-white/5 rounded px-1.5">
                              {actorRole}
                            </span>
                          </div>
                        </div>
                      </td>
                      {/* Details */}
                      <td className="px-5 py-4">{renderDetailsDiff(log)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs font-semibold">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="text-lg">🔍</p>
                      <p className="text-white font-bold">No matching logs</p>
                      <p className="text-zinc-500 text-[10px]">Try changing search terms or clearing some of the filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
