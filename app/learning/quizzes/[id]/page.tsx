import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import QuizWorkspace from "@/components/quizzes/QuizWorkspace";
import { getUserEnrollments } from "@/lib/course/enrollment";
import type { QuizSummary } from "@/types/quiz";

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

type QuizRelation = {
  id: string;
  teacher_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  courses?: { id: string; title: string }[] | { id: string; title: string } | null;
  questions?: QuestionRelation[];
};

function normalizeQuiz(row: QuizRelation) {
  return {
    ...row,
    courses: Array.isArray(row.courses) ? row.courses[0] ?? null : row.courses ?? null,
  };
}

type AttemptRelation = {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: Record<string, string>;
  score: number;
  total_score: number;
  status: "completed";
  submitted_at: string;
  quizzes?: QuizSummary | null;
  profiles?: { id: string; full_name: string | null; email: string | null } | null;
};

type AttemptRelationRow = {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: Record<string, string>;
  score: number;
  total_score: number;
  status: "completed";
  submitted_at: string;
  quizzes?:
    | {
        id: string;
        title: string;
        description: string | null;
        course_id: string | null;
        is_published: boolean;
        created_at: string;
        courses?: { id: string; title: string }[] | { id: string; title: string } | null;
      }
    | {
        id: string;
        title: string;
        description: string | null;
        course_id: string | null;
        is_published: boolean;
        created_at: string;
        courses?: { id: string; title: string }[] | { id: string; title: string } | null;
      }[]
    | null;
  profiles?: { id: string; full_name: string | null; email: string | null } | null;
};

function normalizeAttempt(row: AttemptRelationRow): AttemptRelation {
  const quiz = Array.isArray(row.quizzes) ? row.quizzes[0] ?? null : row.quizzes ?? null;

  return {
    ...row,
    quizzes: quiz
      ? {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          course_id: quiz.course_id,
          is_published: quiz.is_published,
          created_at: quiz.created_at,
          courses: Array.isArray(quiz.courses) ? quiz.courses[0] ?? null : quiz.courses ?? null,
        }
      : null,
  };
}

export default async function LearningQuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/learning/quizzes/${id}`);
  }

  const [profileResult, enrollments, quizResult, attemptsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("id", user.id).single(),
    getUserEnrollments(),
    supabase
      .from("quizzes")
      .select("id, teacher_id, course_id, title, description, is_published, created_at, courses(id, title), questions(id, quiz_id, question_text, question_type, options, correct_answer, points, question_order, created_at)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("attempts")
      .select("id, quiz_id, student_id, answers, score, total_score, status, submitted_at, quizzes(id, title, description, course_id, is_published, created_at, courses(id, title)), profiles(id, full_name, email)")
      .eq("student_id", user.id)
      .eq("quiz_id", id)
      .maybeSingle(),
  ]);

  const quiz = quizResult.data ? normalizeQuiz(quizResult.data as QuizRelation) : null;

  if (!quiz || !quiz.is_published) {
    notFound();
  }

  const enrolledCourseIds = enrollments.map((enrollment) => enrollment.course_id);
  if (quiz.course_id && !enrolledCourseIds.includes(quiz.course_id)) {
    notFound();
  }

  const studentName = profileResult.data?.full_name || profileResult.data?.email || "Student";

  return (
    <QuizWorkspace
      mode="student"
      currentUserId={user.id}
      currentUserName={studentName}
      courses={enrollments.map((enrollment) => enrollment.course)}
      quizzes={[quiz]}
      attempts={attemptsResult.data ? [normalizeAttempt(attemptsResult.data as unknown as AttemptRelationRow)] : []}
      currentQuiz={{
        ...quiz,
        questions: (quiz.questions ?? []).slice().sort((a, b) => a.question_order - b.question_order),
      }}
    />
  );
}
