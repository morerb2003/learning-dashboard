"use client";

import { useState } from "react";
import { CheckCircle2, EyeOff, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface ModerationFlag {
  id: string;
  content_type: "discussion" | "reply" | "message";
  content_id: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  reporter_id: string;
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
  const supabase = createClient();

  const finishReview = async (
    flag: ModerationFlag,
    status: "resolved" | "dismissed",
    hideContent: boolean
  ) => {
    setWorkingId(flag.id);

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
    }
    setWorkingId(null);
  };

  return (
    <div className="space-y-4">
      {flags.map((flag) => (
        <article
          key={flag.id}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[9px] font-black uppercase text-rose-300">
                  {flag.content_type}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">
                  {new Date(flag.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-300">{flag.reason}</p>
              <p className="mt-2 font-mono text-[10px] text-zinc-600">
                Content: {flag.content_id}
              </p>
            </div>
            {flag.status === "open" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={workingId === flag.id}
                  onClick={() => void finishReview(flag, "resolved", true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300"
                >
                  <EyeOff className="h-4 w-4" />
                  Remove Content
                </button>
                <button
                  disabled={workingId === flag.id}
                  onClick={() => void finishReview(flag, "resolved", false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Resolve
                </button>
                <button
                  disabled={workingId === flag.id}
                  onClick={() => void finishReview(flag, "dismissed", false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-zinc-400"
                >
                  <XCircle className="h-4 w-4" />
                  Dismiss
                </button>
              </div>
            ) : (
              <span className="text-xs font-bold uppercase text-zinc-500">{flag.status}</span>
            )}
          </div>
        </article>
      ))}
      {flags.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-zinc-500">
          No moderation reports.
        </div>
      )}
    </div>
  );
}
