import { createClient } from "@/lib/supabase/server";
import AnnouncementManager from "@/components/admin/AnnouncementManager";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("platform_announcements")
    .select("id, title, body, audience, published_at")
    .order("published_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Platform Announcements</h2>
        <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
          Broadcast updates to students, teachers, or the full platform
        </p>
      </div>
      <AnnouncementManager adminId={user?.id ?? ""} initialAnnouncements={data ?? []} />
    </div>
  );
}
