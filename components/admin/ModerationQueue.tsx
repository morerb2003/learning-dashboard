"use client";

import { useState } from "react";
import { CheckCircle2, EyeOff, XCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface ModerationFlag {
  id: string;
  content_type: "discussion" | "reply" | "message";
  content_id: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  reporter_id: string;
  reporter?: {
    full_name: string | null;
    email: string | null;
  } | null;
  reporter_reputation?: {
    total: number;
    valid: number;
    accuracy: number;
  };
  content_body?: string;
  content_author?: string;
  content_author_id?: string;
}

export default function ModerationQueue({
  initialFlags,
  adminId,
}: {
  initialFlags: ModerationFlag[];
  adminId: string;
}) {
  const [flags, setFlags] = useState(initialFlags);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [expandedContentIds, setExpandedContentIds] = useState<Record<string, boolean>>({});
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const supabase = createClient();

  const toggleExpand = (id: string) => {
    setExpandedContentIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const finishReview = async (
    flag: ModerationFlag,
    status: "resolved" | "dismissed",
    hideContent: boolean
  ) => {
    setWorkingId(flag.id);
    setActionStatus(null);

    if (hideContent) {
      if (flag.content_type === "discussion") {
        await supabase
          .from("course_discussions")
          .update({ is_hidden: true })
          .eq("id", flag.content_id);
      } else if (flag.content_type === "reply") {
        await supabase
          .from("discussion_replies")
          .update({ is_hidden: true })
          .eq("id", flag.content_id);
      } else {
        await supabase.from("direct_messages").delete().eq("id", flag.content_id);
      }
    }

    const { error } = await supabase
      .from("moderation_flags")
      .update({
        status,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", flag.id);

    if (!error) {
      setFlags((current) =>
        current.map((item) => (item.id === flag.id ? { ...item, status } : item))
      );
      setActionStatus(`Report marked as ${status} successfully.`);
    } else {
      setActionStatus(`Error updating report: ${error.message}`);
    }
    setWorkingId(null);
  };

  const warnUser = async (flag: ModerationFlag) => {
    const warning = window.prompt(`Enter warning message to send to the author (${flag.content_author}):`);
    if (!warning?.trim()) return;

    setWorkingId(flag.id);
    setActionStatus(null);

    // Insert audit log tracking the warning
    const { error } = await supabase.rpc("write_audit_log", {
      audit_action: "warn_user",
      audit_entity_type: "profiles",
      audit_entity_id: flag.content_author_id || flag.reporter_id,
      audit_details: {
        reason: warning.trim(),
        flag_id: flag.id,
        content_id: flag.content_id,
        content_type: flag.content_type,
      },
    });

    if (!error) {
      setActionStatus(`Warning successfully logged for user ${flag.content_author}.`);
    } else {
      setActionStatus(`Failed to log warning: ${error.message}`);
    }
    setWorkingId(null);
  };

  const suspendUser = async (flag: ModerationFlag) => {
    const confirm = window.confirm(`Are you sure you want to suspend user ${flag.content_author}? This action will write a security event log.`);
    if (!confirm) return;

    setWorkingId(flag.id);
    setActionStatus(null);

    // Write audit log tracking user suspension
    const { error } = await supabase.rpc("write_audit_log", {
      audit_action: "suspend_user",
      audit_entity_type: "profiles",
      audit_entity_id: flag.content_author_id || flag.reporter_id,
      audit_details: {
        reason: "Content moderation suspension",
        flag_id: flag.id,
        content_id: flag.content_id,
      },
    });

    if (!error) {
      setActionStatus(`User ${flag.content_author} account flagged as suspended in security audit logs.`);
    } else {
      setActionStatus(`Failed to record suspension: ${error.message}`);
    }
    setWorkingId(null);
  };

  // Keyword highlighting logic
  function highlightOffensiveKeywords(text: string) {
    if (!text) return null;
    const words = [
      "idiot", "spam", "harass", "hate", "dumb", "fool", "stupid", "fuck", 
      "shit", "asshole", "bitch", "scam", "loser", "kill", "die"
    ];
    const regex = new RegExp(`\\b(${words.join("|")})\\b`, "gi");
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) => {
          const isMatch = words.some((word) => word.toLowerCase() === part.toLowerCase());
          return isMatch ? (
            <mark
              key={index}
              className="bg-amber-400/25 border border-rose-500/25 px-1 py-0.5 rounded text-rose-400 font-bold"
            >
              {part}
            </mark>
          ) : (
            part
          );
        })}
      </>
    );
  }

  // Clamps preview text to 300 characters
  function renderContentBody(flag: ModerationFlag) {
    const text = flag.content_body || "[Content Deleted or Unavailable]";
    const maxLength = 300;
    const isExpanded = expandedContentIds[flag.id] || false;
    const needsTruncation = text.length > maxLength;
    const displayedText = isExpanded || !needsTruncation ? text : `${text.substring(0, maxLength)}...`;

    return (
      <div className="rounded-2xl border border-white/5 bg-zinc-950/60 p-4">
        <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
          <span>Flagged Content Body</span>
          <span className="text-zinc-400">Author: {flag.content_author || "Unknown"}</span>
        </div>
        <div className="whitespace-pre-wrap rounded-xl bg-zinc-950 p-3.5 text-xs leading-relaxed text-zinc-300 font-mono border border-white/5 max-h-80 overflow-y-auto">
          {highlightOffensiveKeywords(displayedText)}
        </div>
        {needsTruncation && (
          <button
            onClick={() => toggleExpand(flag.id)}
            className="mt-2 text-xs font-bold text-violet-400 hover:text-violet-300 cursor-pointer inline-flex items-center gap-1"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        )}
        <p className="mt-2 font-mono text-[9px] text-zinc-600">
          Content ID: {flag.content_id}
        </p>
      </div>
    );
  }

  // Dynamic Badge Color Mapping
  function renderContentTypeBadge(contentType: string) {
    let classes = "border-white/10 bg-white/5 text-zinc-400";
    if (contentType === "discussion") {
      classes = "border-violet-500/20 bg-violet-500/10 text-violet-300";
    } else if (contentType === "reply") {
      classes = "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";
    } else if (contentType === "message") {
      classes = "border-sky-500/20 bg-sky-500/10 text-sky-300";
    }

    return (
      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${classes}`}>
        {contentType === "message" ? "Direct Message" : contentType}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {actionStatus && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-xs text-violet-200">
          {actionStatus}
        </div>
      )}

      {flags.map((flag) => (
        <article
          key={flag.id}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-md"
        >
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_240px]">
            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-3">
                {renderContentTypeBadge(flag.content_type)}
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                  {new Date(flag.created_at).toLocaleString()}
                </span>
                {flag.reporter && (
                  <span className="text-[10px] text-zinc-500 font-semibold">
                    &bull; Reported by: <span className="text-zinc-300 font-bold">{flag.reporter.full_name || flag.reporter.email || "Unknown"}</span>
                  </span>
                )}
              </div>

              {/* Reporter Accuracy Card */}
              {flag.reporter && flag.reporter_reputation && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-zinc-500 border border-white/5 bg-zinc-950/20 rounded-xl px-3 py-2 w-fit">
                  <span className="font-bold uppercase tracking-wider text-[8px] text-zinc-400">Reporter Reputation:</span>
                  <span>Submitted: <strong className="text-zinc-300">{flag.reporter_reputation.total}</strong></span>
                  <span>Valid: <strong className="text-zinc-300">{flag.reporter_reputation.valid}</strong></span>
                  <span>Accuracy: <strong className={flag.reporter_reputation.accuracy >= 75 ? "text-emerald-400" : "text-amber-400"}>{flag.reporter_reputation.accuracy}%</strong></span>
                </div>
              )}

              {/* Reason */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Reason for report</p>
                <p className="mt-1 text-sm font-semibold text-zinc-200">{flag.reason}</p>
              </div>

              {/* Clamped Flagged Content */}
              {renderContentBody(flag)}
            </div>

            {/* Quick Actions Dashboard Panel */}
            <div className="border-t border-white/5 pt-4 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-6 lg:flex lg:flex-col lg:justify-between">
              <div className="space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Moderation Queue</p>

                {flag.status === "open" ? (
                  <div className="flex flex-col gap-2">
                    <button
                      disabled={workingId === flag.id}
                      onClick={() => void finishReview(flag, "resolved", false)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 px-3.5 py-2.5 text-xs font-bold text-emerald-300 cursor-pointer transition-colors"
                      title="Keep content and dismiss report as resolved"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve (Keep Content)
                    </button>

                    <button
                      disabled={workingId === flag.id}
                      onClick={() => void finishReview(flag, "resolved", true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-3.5 py-2.5 text-xs font-bold text-rose-300 cursor-pointer transition-colors"
                      title="Hide/delete the reported content"
                    >
                      <EyeOff className="h-4 w-4" />
                      Delete Content
                    </button>

                    <button
                      disabled={workingId === flag.id}
                      onClick={() => void warnUser(flag)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 px-3.5 py-2.5 text-xs font-bold text-amber-300 cursor-pointer transition-colors"
                      title="Log warning message in audit logs for this author"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Warn User
                    </button>

                    <button
                      disabled={workingId === flag.id}
                      onClick={() => void suspendUser(flag)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/40 hover:bg-red-950/60 border border-red-500/20 px-3.5 py-2.5 text-xs font-bold text-red-400 cursor-pointer transition-colors"
                      title="Log suspension action for this author"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Suspend User
                    </button>

                    <button
                      disabled={workingId === flag.id}
                      onClick={() => void finishReview(flag, "dismissed", false)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2.5 text-xs font-bold text-zinc-300 cursor-pointer transition-colors"
                      title="Dismiss this report"
                    >
                      <XCircle className="h-4 w-4" />
                      Ignore Report (Dismiss)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase">Review Status</p>
                    <span className={`inline-block text-xs font-bold uppercase py-1.5 px-3 rounded-full border ${
                      flag.status === "resolved"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 bg-white/5 text-zinc-500"
                    }`}>
                      {flag.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>
      ))}

      {flags.length === 0 && (
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="absolute inset-0 bg-mesh-cyan opacity-25 pointer-events-none" />
          <div className="grain-overlay" />
          <div className="relative z-10 mx-auto max-w-sm space-y-4">
            <span className="text-4xl block animate-bounce" role="img" aria-label="party popper">🎉</span>
            <h3 className="text-base font-black text-white">No reports pending</h3>
            <p className="text-xs text-zinc-500">
              Everything looks clean and safe. The moderation queue is empty.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
