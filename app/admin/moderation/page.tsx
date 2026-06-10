import { createClient } from "@/lib/supabase/server";
import ModerationQueue, { ModerationFlag } from "@/components/admin/ModerationQueue";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: flags } = await supabase
    .from("moderation_flags")
    .select("id, reporter_id, content_type, content_id, reason, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Content Moderation</h2>
        <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
          Review reports, remove content, and close moderation cases
        </p>
      </div>
      <ModerationQueue initialFlags={(flags ?? []) as ModerationFlag[]} adminId={user?.id ?? ""} />
    </div>
  );
}
