import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, details, created_at")
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
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-white/10 text-[9px] uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-5 py-4">Time</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Entity</th>
                <th className="px-5 py-4">Actor</th>
                <th className="px-5 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(logs ?? []).map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-4 text-zinc-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-5 py-4 font-bold uppercase text-cyan-300">{log.action}</td>
                  <td className="px-5 py-4 text-white">{log.entity_type}<span className="ml-2 font-mono text-zinc-600">{log.entity_id}</span></td>
                  <td className="px-5 py-4 font-mono text-zinc-500">{log.actor_id || "system"}</td>
                  <td className="max-w-sm truncate px-5 py-4 font-mono text-[10px] text-zinc-600">{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
