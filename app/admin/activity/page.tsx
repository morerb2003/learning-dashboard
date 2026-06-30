import { createClient } from "@/lib/supabase/server";
import ActivityLogTable from "@/components/admin/ActivityLogTable";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, details, created_at, actor:profiles(full_name, email, role)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">System Activity & Audit Logs</h2>
        <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
          Immutable records of administrative and content changes
        </p>
      </div>
      <ActivityLogTable initialLogs={(logs ?? []) as any[]} />
    </div>
  );
}
