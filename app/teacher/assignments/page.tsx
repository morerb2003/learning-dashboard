import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssignmentWorkspace from "@/components/assignments/AssignmentWorkspace";

export const dynamic = "force-dynamic";

type AssignmentRelation = {
  id: string;
  title: string;
  deadline: string;
  max_grade: number;
  course_id: string | null;
  courses?: { id: string; title: string } | null;
};

export default async function TeacherAssignmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileResult, coursesResult, assignmentsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("courses")
      .select("id, title")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("assignments")
      .select("id, teacher_id, course_id, title, instructions, deadline, max_grade, created_at, courses(id, title)")
      .eq("teacher_id", user.id)
      .order("deadline", { ascending: true }),
  ]);

  const assignments = (assignmentsResult.data ?? []) as Array<{
    id: string;
    teacher_id: string;
    course_id: string | null;
    title: string;
    instructions: string;
    deadline: string;
    max_grade: number;
    created_at: string;
    courses?: { id: string; title: string } | null;
  }>;

  const assignmentIds = assignments.map((assignment) => assignment.id);
  const submissionsResult = assignmentIds.length > 0
    ? await supabase
        .from("submissions")
        .select("id, assignment_id, student_id, file_url, file_path, status, grade, feedback, submitted_at, reviewed_at, assignments(id, title, deadline, max_grade, course_id, courses(id, title)), profiles(id, full_name, email)")
        .in("assignment_id", assignmentIds)
        .order("submitted_at", { ascending: false })
    : { data: [] };

  const teacherName = profileResult.data?.full_name || profileResult.data?.email || "Teacher";

  return (
    <AssignmentWorkspace
      mode="teacher"
      currentUserId={user.id}
      currentUserName={teacherName}
      courses={(coursesResult.data ?? []) as Array<{ id: string; title: string }>}
      assignments={assignments}
      submissions={(submissionsResult.data ?? []) as Array<{
        id: string;
        assignment_id: string;
        student_id: string;
        file_url: string;
        file_path: string;
        status: "submitted" | "reviewed";
        grade: number | null;
        feedback: string | null;
        submitted_at: string;
        reviewed_at: string | null;
        assignments?: AssignmentRelation | null;
        profiles?: { id: string; full_name: string | null; email: string | null } | null;
      }>}
    />
  );
}
