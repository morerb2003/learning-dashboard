import { createClient } from "@/lib/supabase/server";
import UserTable, { UserProfile } from "@/components/admin/UserTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">User Account Directory</h2>
        <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Search, assign roles, and manage user lifecycles</p>
      </div>
      <UserTable initialUsers={(users || []) as UserProfile[]} />
    </div>
  );
}
