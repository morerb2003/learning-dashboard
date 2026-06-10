import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuizWorkspace from "@/components/quizzes/QuizWorkspace";
import { getUserEnrollments } from "@/lib/course/enrollment";

export const dynamic = "force-dynamic";

type QuestionRelation = {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: "mcq" | "true_false";
  options: string[];
  correct_answer: string;
  points: number;
  question_order: number;
  created_at: string;
};

type AttemptRelation = {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: Record<string, string>;
  score: number;
  total_score: number;
  status: "completed";
  submitted_at: string;
  quizzes?: {
    id: string;
    title: string;
    description: string | null;
    course_id: string | null;
    is_published: boolean;
    created_at: string;
    courses?: { id: string; title: string } | null;
  } | null;
  profiles?: { id: string; full_name: string | null; email: string | null } | null;
};

export default async function LearningQuizzesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/learning/quizzes");
  }

  const [profileResult, enrollments, quizzesResult, attemptsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("id", user.id).single(),
    getUserEnrollments(),
    supabase
      .from("quizzes")
      .select("id, teacher_id, course_id, title, description, is_published, created_at, courses(id, title), questions(id, quiz_id, question_text, question_type, options, correct_answer, points, question_order, created_at)")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("attempts")
      .select("id, quiz_id, student_id, answers, score, total_score, status, submitted_at, quizzes(id, title, description, course_id, is_published, created_at, courses(id, title)), profiles(id, full_name, email)")
      .eq("student_id", user.id)
      .order("submitted_at", { ascending: false }),
  ]);

  const enrolledCourseIds = enrollments.map((enrollment) => enrollment.course_id);
  const quizzes = ((quizzesResult.data ?? []) as Array<{
    id: string;
    teacher_id: string;
    course_id: string | null;
    title: string;
    description: string | null;
    is_published: boolean;
    created_at: string;
    courses?: { id: string; title: string } | null;
    questions?: QuestionRelation[];
  }>).filter((quiz) => {
    if (!quiz.course_id) return true;
    return enrolledCourseIds.includes(quiz.course_id);
  });

  const studentName = profileResult.data?.full_name || profileResult.data?.email || "Student";

  return (
    <QuizWorkspace
      mode="student"
      currentUserId={user.id}
      currentUserName={studentName}
      courses={enrollments.map((enrollment) => enrollment.course)}
      quizzes={quizzes}
      attempts={(attemptsResult.data ?? []) as AttemptRelation[]}
    />
  );
}
