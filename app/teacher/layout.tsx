import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TeacherLayout from "@/components/teacher/TeacherLayout";

export const dynamic = "force-dynamic";

export default async function TeacherLayoutPage({
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

  if (profileError || !profile || (profile.role !== "teacher" && profile.role !== "admin")) {
    redirect("/");
  }

  return (
    <TeacherLayout profile={profile}>
      {children}
    </TeacherLayout>
  );
}
