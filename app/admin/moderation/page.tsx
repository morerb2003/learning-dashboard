import { createClient } from "@/lib/supabase/server";
import ModerationQueue from "@/components/admin/ModerationQueue";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch flags with reporter details
  const { data: rawFlags } = await supabase
    .from("moderation_flags")
    .select("id, reporter_id, content_type, content_id, reason, status, created_at, reporter:profiles(full_name, email)")
    .order("created_at", { ascending: false });

  const flags = rawFlags ?? [];

  // Group flags by reporter to calculate reputation stats dynamically
  const reporterStatsMap = new Map<string, { total: number; valid: number }>();
  for (const flag of flags) {
    const stats = reporterStatsMap.get(flag.reporter_id) ?? { total: 0, valid: 0 };
    stats.total += 1;
    if (flag.status === "resolved") {
      stats.valid += 1;
    }
    reporterStatsMap.set(flag.reporter_id, stats);
  }

  // Group by content type to fetch actual contents in parallel batches
  const discussionIds = flags
    .filter((f) => f.content_type === "discussion")
    .map((f) => f.content_id);
  const replyIds = flags
    .filter((f) => f.content_type === "reply")
    .map((f) => f.content_id);
  const messageIds = flags
    .filter((f) => f.content_type === "message")
    .map((f) => f.content_id);

  const [discussionsRes, repliesRes, messagesRes] = await Promise.all([
    discussionIds.length > 0
      ? supabase
          .from("course_discussions")
          .select("id, title, body, author_id, profiles(id, full_name, email)")
          .in("id", discussionIds)
      : Promise.resolve({ data: [] }),
    replyIds.length > 0
      ? supabase
          .from("discussion_replies")
          .select("id, body, author_id, profiles(id, full_name, email)")
          .in("id", replyIds)
      : Promise.resolve({ data: [] }),
    messageIds.length > 0
      ? supabase
          .from("direct_messages")
          .select("id, body, sender_id, profiles(id, full_name, email)")
          .in("id", messageIds)
      : Promise.resolve({ data: [] }),
  ]);

  const discussionMap = new Map((discussionsRes.data ?? []).map((d) => [d.id, d]));
  const replyMap = new Map((repliesRes.data ?? []).map((r) => [r.id, r]));
  const messageMap = new Map((messagesRes.data ?? []).map((m) => [m.id, m]));

  const richFlags = flags.map((flag) => {
    let contentBody = "";
    let contentAuthor = "";
    let contentAuthorId = "";

    if (flag.content_type === "discussion") {
      const disc = discussionMap.get(flag.content_id);
      if (disc) {
        contentBody = `[Title: ${disc.title}]\n\n${disc.body}`;
        const p = (disc as any).profiles;
        const authorProfile = Array.isArray(p) ? p[0] : p;
        contentAuthor = authorProfile ? (authorProfile.full_name || authorProfile.email || "Unknown") : "Unknown";
        contentAuthorId = authorProfile?.id || "";
      }
    } else if (flag.content_type === "reply") {
      const rep = replyMap.get(flag.content_id);
      if (rep) {
        contentBody = rep.body;
        const p = (rep as any).profiles;
        const authorProfile = Array.isArray(p) ? p[0] : p;
        contentAuthor = authorProfile ? (authorProfile.full_name || authorProfile.email || "Unknown") : "Unknown";
        contentAuthorId = authorProfile?.id || "";
      }
    } else if (flag.content_type === "message") {
      const msg = messageMap.get(flag.content_id);
      if (msg) {
        contentBody = msg.body;
        const p = (msg as any).profiles;
        const authorProfile = Array.isArray(p) ? p[0] : p;
        contentAuthor = authorProfile ? (authorProfile.full_name || authorProfile.email || "Unknown") : "Unknown";
        contentAuthorId = authorProfile?.id || "";
      }
    }

    const rawRep = (flag as any).reporter;
    const reporterProfile = Array.isArray(rawRep) ? rawRep[0] : rawRep;

    const repStats = reporterStatsMap.get(flag.reporter_id) ?? { total: 0, valid: 0 };
    const accuracy = repStats.total > 0 ? Math.round((repStats.valid / repStats.total) * 100) : 100;
    const reporterReputation = {
      total: repStats.total,
      valid: repStats.valid,
      accuracy,
    };

    return {
      id: flag.id,
      content_type: flag.content_type,
      content_id: flag.content_id,
      reason: flag.reason,
      status: flag.status,
      created_at: flag.created_at,
      reporter_id: flag.reporter_id,
      reporter: reporterProfile ?? null,
      reporter_reputation: reporterReputation,
      content_body: contentBody || "[Content deleted or hidden]",
      content_author: contentAuthor || "System/Deleted User",
      content_author_id: contentAuthorId,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Content Moderation</h2>
        <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
          Review reports, remove content, and close moderation cases
        </p>
      </div>
      <ModerationQueue initialFlags={richFlags as any[]} adminId={user?.id ?? ""} />
    </div>
  );
}
