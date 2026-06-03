import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";

export const dynamic = "force-dynamic";

export default async function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <AdminLayout profile={profile}>
      {children}
    </AdminLayout>
  );
}
