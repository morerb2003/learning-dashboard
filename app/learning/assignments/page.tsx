import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssignmentWorkspace from "@/components/assignments/AssignmentWorkspace";
import { getUserEnrollments } from "@/lib/course/enrollment";

export const dynamic = "force-dynamic";

type AssignmentRelation = {
  id: string;
  title: string;
  deadline: string;
  max_grade: number;
  course_id: string | null;
  courses?: { id: string; title: string } | null;
};

export default async function LearningAssignmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/learning/assignments");
  }

  const [profileResult, enrollments, assignmentsResult, submissionsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", user.id)
      .single(),
    getUserEnrollments(),
    supabase
      .from("assignments")
      .select("id, teacher_id, course_id, title, instructions, deadline, max_grade, created_at, courses(id, title)")
      .order("deadline", { ascending: true }),
    supabase
      .from("submissions")
      .select("id, assignment_id, student_id, file_url, file_path, status, grade, feedback, submitted_at, reviewed_at, assignments(id, title, deadline, max_grade, course_id, courses(id, title)), profiles(id, full_name, email)")
      .eq("student_id", user.id)
      .order("submitted_at", { ascending: false }),
  ]);

  const enrolledCourseIds = enrollments.map((enrollment) => enrollment.course_id);
  const assignments = ((assignmentsResult.data ?? []) as Array<{
    id: string;
    teacher_id: string;
    course_id: string | null;
    title: string;
    instructions: string;
    deadline: string;
    max_grade: number;
    created_at: string;
    courses?: { id: string; title: string } | null;
  }>).filter((assignment) => {
    if (!assignment.course_id) return true;
    return enrolledCourseIds.includes(assignment.course_id);
  });

  const studentName = profileResult.data?.full_name || profileResult.data?.email || "Student";

  return (
    <AssignmentWorkspace
      mode="student"
      currentUserId={user.id}
      currentUserName={studentName}
      courses={enrollments.map((enrollment) => enrollment.course)}
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
      enrolledCourseIds={enrolledCourseIds}
    />
  );
}
