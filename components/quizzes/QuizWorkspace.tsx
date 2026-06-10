"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Quiz, QuizAttempt, QuizQuestion, QuestionType } from "@/types/quiz";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  GraduationCap,
  Plus,
  Send,
  Trophy,
  Users,
} from "lucide-react";

type QuizCourse = {
  id: string;
  title: string;
};

type QuizWithMeta = Quiz & {
  questions?: QuizQuestion[];
};

type AttemptWithMeta = QuizAttempt & {
  quizzes?: QuizWithMeta | null;
  profiles?: { id: string; full_name: string | null; email: string | null } | null;
};

type DraftQuestion = {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options: [string, string, string, string];
  correct_answer: string;
  points: number;
};

interface QuizWorkspaceProps {
  mode: "teacher" | "student";
  currentUserId: string;
  currentUserName: string;
  courses: QuizCourse[];
  quizzes: QuizWithMeta[];
  attempts: AttemptWithMeta[];
  currentQuiz?: QuizWithMeta | null;
}

const initialDraftQuestion = (): DraftQuestion => ({
  id: crypto.randomUUID(),
  question_text: "",
  question_type: "mcq",
  options: ["", "", "", ""],
  correct_answer: "",
  points: 1,
});

function getQuizCourseTitle(quiz: QuizWithMeta) {
  return quiz.courses?.title || (quiz.course_id ? "Unassigned course" : "General quiz");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function computeResult(questions: QuizQuestion[], answers: Record<string, string>) {
  const totalScore = questions.reduce((sum, question) => sum + question.points, 0);
  const score = questions.reduce((sum, question) => {
    const answer = answers[question.id] ?? "";
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedCorrect = question.correct_answer.trim().toLowerCase();
    if (normalizedAnswer === normalizedCorrect) {
      return sum + question.points;
    }
    return sum;
  }, 0);

  return { score, totalScore };
}

export default function QuizWorkspace({
  mode,
  currentUserId,
  currentUserName,
  courses,
  quizzes,
  attempts,
  currentQuiz,
}: QuizWorkspaceProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [quizRows, setQuizRows] = useState(quizzes);
  const [attemptRows, setAttemptRows] = useState(attempts);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftCourseId, setDraftCourseId] = useState<string>("");
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([initialDraftQuestion()]);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const teacherStats = useMemo(() => {
    const totalAttempts = attemptRows.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            attemptRows.reduce((sum, attempt) => sum + (attempt.total_score > 0 ? (attempt.score / attempt.total_score) * 100 : 0), 0) /
              totalAttempts
          )
        : 0;
    return {
      quizzes: quizRows.length,
      attempts: totalAttempts,
      avgScore,
    };
  }, [attemptRows, quizRows.length]);

  const studentStats = useMemo(() => {
    const attemptsByUser = attemptRows.filter((attempt) => attempt.student_id === currentUserId);
    return {
      available: quizRows.length,
      completed: attemptsByUser.length,
      bestScore:
        attemptsByUser.length > 0
          ? Math.max(...attemptsByUser.map((attempt) => (attempt.total_score > 0 ? Math.round((attempt.score / attempt.total_score) * 100) : 0)))
          : 0,
    };
  }, [attemptRows, currentUserId, quizRows.length]);

  const selectedQuiz = currentQuiz ?? null;
  const selectedQuestions = selectedQuiz?.questions ?? [];
  const currentAttempt = selectedQuiz
    ? attemptRows.find((attempt) => attempt.quiz_id === selectedQuiz.id && attempt.student_id === currentUserId)
    : null;

  const clearMessages = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const updateQuestion = (questionId: string, patch: Partial<DraftQuestion>) => {
    setDraftQuestions((current) => current.map((question) => (question.id === questionId ? { ...question, ...patch } : question)));
  };

  const addQuestion = () => {
    setDraftQuestions((current) => [...current, initialDraftQuestion()]);
  };

  const removeQuestion = (questionId: string) => {
    setDraftQuestions((current) => current.filter((question) => question.id !== questionId));
  };

  const handleCreateQuiz = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();
    setIsSavingQuiz(true);

    try {
      if (!draftTitle.trim()) {
        throw new Error("Quiz title is required.");
      }

      const preparedQuestions = draftQuestions.map((question, index) => {
        const cleanedOptions = question.question_type === "mcq"
          ? question.options.map((option) => option.trim()).filter(Boolean)
          : ["True", "False"];

        const correctAnswer = question.correct_answer.trim();
        if (!question.question_text.trim()) {
          throw new Error(`Question ${index + 1} needs text.`);
        }
        if (question.question_type === "mcq" && cleanedOptions.length < 2) {
          throw new Error(`Question ${index + 1} needs at least two answer options.`);
        }
        if (!correctAnswer) {
          throw new Error(`Question ${index + 1} needs a correct answer.`);
        }

        return {
          question_text: question.question_text.trim(),
          question_type: question.question_type,
          options: cleanedOptions,
          correct_answer: correctAnswer,
          points: Math.max(1, Math.round(question.points || 1)),
          question_order: index + 1,
        };
      });

      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          teacher_id: currentUserId,
          course_id: draftCourseId || null,
          title: draftTitle.trim(),
          description: draftDescription.trim() || null,
          is_published: true,
        })
        .select("id, teacher_id, course_id, title, description, is_published, created_at, courses(id, title)")
        .single();

      if (quizError) {
        throw quizError;
      }

      const quiz = quizData as QuizWithMeta;
      if (preparedQuestions.length > 0) {
        const { error: questionError } = await supabase.from("questions").insert(
          preparedQuestions.map((question) => ({
            quiz_id: quiz.id,
            ...question,
          }))
        );

        if (questionError) {
          throw questionError;
        }
      }

      const createdQuiz = {
        ...quiz,
        questions: preparedQuestions.map((question, index) => ({
          id: `${quiz.id}-${index + 1}`,
          quiz_id: quiz.id,
          created_at: quiz.created_at,
          ...question,
        })),
      } satisfies QuizWithMeta;

      setQuizRows((current) => [createdQuiz, ...current]);
      setStatusMessage(`Quiz \"${draftTitle.trim()}\" created.`);
      setDraftTitle("");
      setDraftDescription("");
      setDraftCourseId("");
      setDraftQuestions([initialDraftQuestion()]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create quiz.");
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleSubmitAttempt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    if (!selectedQuiz) {
      setErrorMessage("Quiz is not available.");
      return;
    }

    if (selectedQuestions.length === 0) {
      setErrorMessage("This quiz has no questions.");
      return;
    }

    const { score, totalScore } = computeResult(selectedQuestions, answers);
    setIsSubmittingAttempt(true);

    try {
      const { data, error } = await supabase
        .from("attempts")
        .upsert(
          {
            quiz_id: selectedQuiz.id,
            student_id: currentUserId,
            answers,
            score,
            total_score: totalScore,
            status: "completed",
            submitted_at: new Date().toISOString(),
          },
          { onConflict: "quiz_id,student_id" }
        )
        .select(
          "id, quiz_id, student_id, answers, score, total_score, status, submitted_at, quizzes(id, title, description, course_id, is_published, created_at, courses(id, title)), profiles(id, full_name, email)"
        )
        .single();

      if (error) {
        throw error;
      }

      const attempt = data as AttemptWithMeta;
      setAttemptRows((current) => {
        const remaining = current.filter(
          (row) => !(row.quiz_id === selectedQuiz.id && row.student_id === currentUserId)
        );
        return [attempt, ...remaining];
      });
      setStatusMessage(`Score saved: ${score}/${totalScore}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save attempt.");
    } finally {
      setIsSubmittingAttempt(false);
    }
  };

  if (mode === "teacher") {
    return (
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6 md:p-7">
          <div className="absolute inset-0 bg-mesh-violet opacity-35 pointer-events-none" />
          <div className="grain-overlay" />
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-300">
                <ClipboardList className="h-3.5 w-3.5" />
                Teacher Workflow
              </span>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">Quiz control center</h1>
              <p className="max-w-2xl text-sm text-zinc-400">
                Create quizzes, add MCQ or True/False questions, and monitor student attempts and scores.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3 text-xs text-zinc-300">
              <p className="font-bold text-white">{currentUserName}</p>
              <p className="mt-0.5 text-zinc-500">Teacher quiz builder</p>
            </div>
          </div>
        </section>

        {errorMessage && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div>}
        {statusMessage && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{statusMessage}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Quizzes", value: teacherStats.quizzes, icon: BookOpen, color: "text-violet-300", bg: "bg-mesh-violet" },
            { label: "Attempts", value: teacherStats.attempts, icon: Users, color: "text-cyan-300", bg: "bg-mesh-cyan" },
            { label: "Avg Score", value: `${teacherStats.avgScore}%`, icon: Trophy, color: "text-emerald-300", bg: "bg-mesh-emerald" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className={`absolute inset-0 ${card.bg} opacity-25 pointer-events-none`} />
                <div className="grain-overlay" />
                <div className="relative z-10 flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{card.label}</span>
                  <div className={`rounded-lg border border-white/10 bg-white/[0.04] p-2 ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="relative z-10 mt-6 text-3xl font-black tracking-tight text-white">{card.value}</p>
              </div>
            );
          })}
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Create Quiz</h2>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">MCQ and True/False questions</p>
            </div>
            <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">Teacher only</div>
          </div>

          <form onSubmit={handleCreateQuiz} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Course</label>
                <select value={draftCourseId} onChange={(e) => setDraftCourseId(e.target.value)} className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50">
                  <option value="">General quiz</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Quiz Title</label>
                <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="e.g. React Fundamentals Checkpoint" className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Description</label>
              <textarea value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} rows={3} placeholder="Explain what this quiz checks..." className="w-full resize-none rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Questions</h3>
                <button type="button" onClick={addQuestion} className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20">
                  <Plus className="h-4 w-4" /> Add Question
                </button>
              </div>

              <div className="space-y-4">
                {draftQuestions.map((question, index) => (
                  <article key={question.id} className="rounded-3xl border border-white/5 bg-zinc-950/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10 text-violet-300">{index + 1}</span>
                        Question {index + 1}
                      </div>
                      {draftQuestions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(question.id)} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition hover:text-white">Remove</button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-2 lg:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Question Text</label>
                        <input value={question.question_text} onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })} placeholder="What is the answer?" className="w-full rounded-2xl border border-white/5 bg-zinc-900/50 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Type</label>
                        <select value={question.question_type} onChange={(e) => updateQuestion(question.id, { question_type: e.target.value as QuestionType, correct_answer: e.target.value === "true_false" ? "True" : question.correct_answer, options: e.target.value === "true_false" ? ["True", "False", "", ""] : question.options })} className="w-full rounded-2xl border border-white/5 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50">
                          <option value="mcq">MCQ</option>
                          <option value="true_false">True / False</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Points</label>
                        <input type="number" min="1" value={question.points} onChange={(e) => updateQuestion(question.id, { points: Number(e.target.value) })} className="w-full rounded-2xl border border-white/5 bg-zinc-900/50 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50" />
                      </div>

                      {question.question_type === "mcq" ? (
                        <div className="lg:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Option {optionIndex + 1}</label>
                              <input value={option} onChange={(e) => {
                                const nextOptions = [...question.options] as [string, string, string, string];
                                nextOptions[optionIndex] = e.target.value;
                                updateQuestion(question.id, { options: nextOptions });
                              }} className="w-full rounded-2xl border border-white/5 bg-zinc-900/50 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50" placeholder={`Option ${optionIndex + 1}`} />
                            </div>
                          ))}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Correct Answer</label>
                            <select value={question.correct_answer} onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })} className="w-full rounded-2xl border border-white/5 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50">
                              <option value="">Select correct option</option>
                              {question.options.filter(Boolean).map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="lg:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Correct Answer</label>
                          <select value={question.correct_answer} onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })} className="w-full rounded-2xl border border-white/5 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50">
                            <option value="">Select correct answer</option>
                            <option value="True">True</option>
                            <option value="False">False</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isSavingQuiz} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50">
              {isSavingQuiz ? "Saving..." : "Create Quiz"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">Quiz Library</h2>
            <span className="h-px flex-1 bg-white/5" />
          </div>
          {quizRows.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {quizRows.map((quiz) => {
                const quizAttempts = attemptRows.filter((attempt) => attempt.quiz_id === quiz.id);
                return (
                  <article key={quiz.id} className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                    <div className="absolute inset-0 bg-mesh-violet opacity-20 pointer-events-none" />
                    <div className="grain-overlay" />
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                            {getQuizCourseTitle(quiz)}
                          </div>
                          <h3 className="text-xl font-black tracking-tight text-white">{quiz.title}</h3>
                          <p className="max-w-2xl text-sm text-zinc-400">{quiz.description || "No description provided."}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${quiz.is_published ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-orange-500/20 bg-orange-500/10 text-orange-300"}`}>
                          {quiz.is_published ? "Published" : "Draft"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Questions</p>
                          <p className="mt-1 text-sm font-bold text-white">{quiz.questions?.length ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Attempts</p>
                          <p className="mt-1 text-sm font-bold text-white">{quizAttempts.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Created</p>
                          <p className="mt-1 text-sm font-bold text-white">{formatDate(quiz.created_at)}</p>
                        </div>
                      </div>

                      {quizAttempts.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Recent attempts</h4>
                          {quizAttempts.slice(0, 3).map((attempt) => {
                            const percent = attempt.total_score > 0 ? Math.round((attempt.score / attempt.total_score) * 100) : 0;
                            return (
                              <div key={attempt.id} className="rounded-2xl border border-white/5 bg-zinc-950/40 p-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <p className="text-sm font-semibold text-white">{attempt.profiles?.full_name || attempt.profiles?.email || "Student"}</p>
                                    <p className="mt-0.5 text-[10px] uppercase tracking-widest text-zinc-500">{formatDate(attempt.submitted_at)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-white">{attempt.score}/{attempt.total_score}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{percent}%</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/30 px-4 py-6 text-sm text-zinc-500">
                          No attempts yet.
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center text-sm text-zinc-500">No quizzes created yet.</div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6 md:p-7">
        <div className="absolute inset-0 bg-mesh-cyan opacity-35 pointer-events-none" />
        <div className="grain-overlay" />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
              <GraduationCap className="h-3.5 w-3.5" />
              Student Workflow
            </span>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">Quiz inbox</h1>
            <p className="max-w-2xl text-sm text-zinc-400">
              Open available quizzes, answer the questions, and get your score automatically when you submit.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3 text-xs text-zinc-300">
            <p className="font-bold text-white">{currentUserName}</p>
            <p className="mt-0.5 text-zinc-500">Quiz participant</p>
          </div>
        </div>
      </section>

      {errorMessage && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div>}
      {statusMessage && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{statusMessage}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Available", value: studentStats.available, icon: BookOpen, color: "text-cyan-300", bg: "bg-mesh-cyan" },
          { label: "Completed", value: studentStats.completed, icon: CheckCircle2, color: "text-emerald-300", bg: "bg-mesh-emerald" },
          { label: "Best Score", value: `${studentStats.bestScore}%`, icon: Trophy, color: "text-violet-300", bg: "bg-mesh-violet" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className={`absolute inset-0 ${card.bg} opacity-25 pointer-events-none`} />
              <div className="grain-overlay" />
              <div className="relative z-10 flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{card.label}</span>
                <div className={`rounded-lg border border-white/10 bg-white/[0.04] p-2 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="relative z-10 mt-6 text-3xl font-black tracking-tight text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      {!selectedQuiz ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">Available Quizzes</h2>
            <span className="h-px flex-1 bg-white/5" />
          </div>

          {quizRows.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {quizRows.map((quiz) => {
                const alreadyAttempted = attemptRows.some((attempt) => attempt.quiz_id === quiz.id && attempt.student_id === currentUserId);
                return (
                  <article key={quiz.id} className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                    <div className="absolute inset-0 bg-mesh-cyan opacity-20 pointer-events-none" />
                    <div className="grain-overlay" />
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                            {getQuizCourseTitle(quiz)}
                          </div>
                          <h3 className="text-xl font-black tracking-tight text-white">{quiz.title}</h3>
                          <p className="max-w-2xl text-sm text-zinc-400">{quiz.description || "No description provided."}</p>
                        </div>
                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">{quiz.questions?.length ?? 0} questions</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</p>
                          <p className="mt-1 text-sm font-bold text-white">{alreadyAttempted ? "Attempted" : "Ready"}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Created</p>
                          <p className="mt-1 text-sm font-bold text-white">{formatDate(quiz.created_at)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Attempts</p>
                          <p className="mt-1 text-sm font-bold text-white">{attemptRows.filter((attempt) => attempt.quiz_id === quiz.id).length}</p>
                        </div>
                      </div>
                      <a href={`/learning/quizzes/${quiz.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 px-4 py-2.5 text-xs font-black text-zinc-950 shadow-xl shadow-cyan-500/20 transition hover:brightness-110">
                        Start Quiz
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center text-sm text-zinc-500">No quizzes are available yet.</div>
          )}
        </section>
      ) : (
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">Take Quiz</h2>
            <span className="h-px flex-1 bg-white/5" />
          </div>

          <article className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
            <div className="absolute inset-0 bg-mesh-cyan opacity-20 pointer-events-none" />
            <div className="grain-overlay" />
            <div className="relative z-10 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    {selectedQuiz.questions?.length ?? 0} questions
                  </div>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{selectedQuiz.title}</h3>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-400">{selectedQuiz.description || "Answer each question and submit for automatic evaluation."}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3 text-xs text-zinc-300">
                  <p className="font-bold text-white">{getQuizCourseTitle(selectedQuiz)}</p>
                  <p className="mt-0.5 text-zinc-500">Start your attempt below</p>
                </div>
              </div>

              {currentAttempt && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    Previous score: {currentAttempt.score}/{currentAttempt.total_score}
                  </div>
                  <p className="mt-1 text-xs text-emerald-100/80">Submitted {formatDate(currentAttempt.submitted_at)}</p>
                </div>
              )}

              <form onSubmit={handleSubmitAttempt} className="space-y-4">
                {selectedQuestions.map((question, index) => (
                  <fieldset key={question.id} className="rounded-3xl border border-white/5 bg-zinc-950/40 p-4">
                    <legend className="px-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Question {index + 1}</legend>
                    <p className="mt-2 text-sm font-semibold text-white">{question.question_text}</p>
                    {question.question_type === "mcq" ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {question.options.filter(Boolean).map((option) => (
                          <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${answers[question.id] === option ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100" : "border-white/5 bg-white/[0.03] text-zinc-300 hover:border-white/10 hover:bg-white/[0.05]"}`}>
                            <input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} className="h-4 w-4 accent-cyan-400" />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {["True", "False"].map((option) => (
                          <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${answers[question.id] === option ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100" : "border-white/5 bg-white/[0.03] text-zinc-300 hover:border-white/10 hover:bg-white/[0.05]"}`}>
                            <input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} className="h-4 w-4 accent-cyan-400" />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      <span>Points: {question.points}</span>
                      <span>{question.question_type === "mcq" ? "Multiple choice" : "True / False"}</span>
                    </div>
                  </fieldset>
                ))}

                <button type="submit" disabled={isSubmittingAttempt} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50">
                  {isSubmittingAttempt ? "Scoring..." : "Submit Quiz"}
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
