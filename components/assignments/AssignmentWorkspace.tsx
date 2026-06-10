"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Assignment, AssignmentSummary, AssignmentSubmission } from "@/types/assignment";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  MessageSquareText,
  Paperclip,
  Send,
  ShieldCheck,
  Star,
  UploadCloud,
  Users,
} from "lucide-react";

type AssignmentCourse = {
  id: string;
  title: string;
};

type AssignmentWithMeta = Assignment & {
  courses?: AssignmentCourse | null;
};

type SubmissionWithMeta = AssignmentSubmission & {
  assignments?: AssignmentSummary | null;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
};

interface AssignmentWorkspaceProps {
  mode: "teacher" | "student";
  currentUserId: string;
  currentUserName: string;
  courses: AssignmentCourse[];
  assignments: AssignmentWithMeta[];
  submissions: SubmissionWithMeta[];
  enrolledCourseIds?: string[];
}

const formatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return formatter.format(new Date(value));
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getAssignmentCourseTitle(assignment?: { course_id: string | null; courses?: AssignmentCourse | null } | null) {
  if (!assignment) return "General assignment";
  return assignment.courses?.title || (assignment.course_id ? "Unassigned course" : "General assignment");
}

function getSubmissionAssignmentTitle(submission: SubmissionWithMeta) {
  return submission.assignments?.title || "Assignment";
}

function normalizeAssignmentWithMeta(row: AssignmentWithMeta): AssignmentWithMeta {
  return {
    ...row,
    courses: Array.isArray(row.courses) ? row.courses[0] ?? null : row.courses ?? null,
  };
}

function normalizeSubmissionWithMeta(row: SubmissionWithMeta): SubmissionWithMeta {
  const assignment = row.assignments;

  return {
    ...row,
    assignments: assignment
      ? {
          id: assignment.id,
          title: assignment.title,
          deadline: assignment.deadline,
          max_grade: assignment.max_grade,
          course_id: assignment.course_id,
          courses: Array.isArray(assignment.courses) ? assignment.courses[0] ?? null : assignment.courses ?? null,
        }
      : null,
  };
}

export default function AssignmentWorkspace({
  mode,
  currentUserId,
  currentUserName,
  courses,
  assignments,
  submissions,
  enrolledCourseIds = [],
}: AssignmentWorkspaceProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [assignmentRows, setAssignmentRows] = useState(assignments);
  const [submissionRows, setSubmissionRows] = useState(submissions);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(null);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visibleAssignments =
    mode === "student"
      ? assignmentRows.filter((assignment) => {
          if (!assignment.course_id) return true;
          return enrolledCourseIds.includes(assignment.course_id);
        })
      : assignmentRows;

  const submissionsByAssignment = useMemo(() => {
    return submissionRows.reduce<Record<string, SubmissionWithMeta[]>>((acc, submission) => {
      if (!acc[submission.assignment_id]) {
        acc[submission.assignment_id] = [];
      }
      acc[submission.assignment_id].push(submission);
      return acc;
    }, {});
  }, [submissionRows]);

  const studentSubmissions = useMemo(
    () => submissionRows.filter((submission) => submission.student_id === currentUserId),
    [currentUserId, submissionRows]
  );

  const teacherStats = useMemo(() => {
    const pendingReviews = submissionRows.filter((submission) => submission.status === "submitted").length;
    const reviewed = submissionRows.filter((submission) => submission.status === "reviewed").length;
    const avgGrade =
      reviewed > 0
        ? Math.round(
            submissionRows.reduce((sum, submission) => sum + (submission.grade ?? 0), 0) /
              reviewed
          )
        : 0;

    return {
      assignments: assignmentRows.length,
      pendingReviews,
      reviewed,
      avgGrade,
    };
  }, [assignmentRows.length, submissionRows]);

  const studentStats = useMemo(() => {
    const submitted = studentSubmissions.length;
    const reviewed = studentSubmissions.filter((submission) => submission.status === "reviewed").length;

    return {
      visibleAssignments: visibleAssignments.length,
      submitted,
      reviewed,
      pending: Math.max(visibleAssignments.length - submitted, 0),
    };
  }, [studentSubmissions, visibleAssignments.length]);

  const clearMessages = () => {
    setStatusMessage(null);
    setActionError(null);
  };

  const uploadFile = async (assignmentId: string, file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const path = `${currentUserId}/${assignmentId}/${safeName}`;

    const { error } = await supabase.storage
      .from("assignment-submissions")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("assignment-submissions").getPublicUrl(path);
    return { path, url: data.publicUrl };
  };

  const handleCreateAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();
    setIsCreatingAssignment(true);

    try {
      const formData = new FormData(event.currentTarget);
      const title = String(formData.get("title") ?? "").trim();
      const instructions = String(formData.get("instructions") ?? "").trim();
      const deadline = String(formData.get("deadline") ?? "");
      const maxGrade = Number(formData.get("max_grade") ?? 100);
      const courseId = String(formData.get("course_id") ?? "").trim() || null;

      if (!title || !instructions || !deadline) {
        throw new Error("Title, instructions, and deadline are required.");
      }

      const parsedDeadline = new Date(deadline);
      if (Number.isNaN(parsedDeadline.getTime())) {
        throw new Error("Please choose a valid deadline.");
      }

      if (!Number.isFinite(maxGrade) || maxGrade <= 0) {
        throw new Error("Max grade must be greater than zero.");
      }

      const { data, error } = await supabase
        .from("assignments")
        .insert({
          teacher_id: currentUserId,
          course_id: courseId,
          title,
          instructions,
          deadline: parsedDeadline.toISOString(),
          max_grade: Math.round(maxGrade),
        })
        .select("id, teacher_id, course_id, title, instructions, deadline, max_grade, created_at, courses(id, title)")
        .single();

      if (error) {
        throw error;
      }

      setAssignmentRows((current) => [normalizeAssignmentWithMeta(data as unknown as AssignmentWithMeta), ...current]);
      setStatusMessage(`Assignment \"${title}\" created.`);
      event.currentTarget.reset();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to create assignment.");
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  const handleSubmitAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(event.currentTarget);
    const assignmentId = String(formData.get("assignment_id") ?? "");
    const file = formData.get("file");

    if (!assignmentId) {
      setActionError("Missing assignment id.");
      return;
    }

    if (!(file instanceof File) || file.size === 0) {
      setActionError("Please choose a PDF file to submit.");
      return;
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".pdf") && file.type !== "application/pdf") {
      setActionError("Assignments must be submitted as a PDF.");
      return;
    }

    setSubmittingAssignmentId(assignmentId);

    try {
      const uploaded = await uploadFile(assignmentId, file);

      const { data, error } = await supabase
        .from("submissions")
        .upsert(
          {
            assignment_id: assignmentId,
            student_id: currentUserId,
            file_url: uploaded.url,
            file_path: uploaded.path,
            status: "submitted",
            grade: null,
            feedback: null,
            submitted_at: new Date().toISOString(),
            reviewed_at: null,
          },
          { onConflict: "assignment_id,student_id" }
        )
        .select(
          "id, assignment_id, student_id, file_url, file_path, status, grade, feedback, submitted_at, reviewed_at, assignments(id, title, deadline, max_grade, course_id, courses(id, title)), profiles(id, full_name, email)"
        )
        .single();

      if (error) {
        throw error;
      }

      const nextSubmission = normalizeSubmissionWithMeta(data as unknown as SubmissionWithMeta);
      setSubmissionRows((current) => {
        const remaining = current.filter(
          (submission) => !(submission.assignment_id === assignmentId && submission.student_id === currentUserId)
        );
        return [nextSubmission, ...remaining];
      });
      setStatusMessage("PDF submitted successfully.");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setSubmittingAssignmentId(null);
    }
  };

  const handleReviewSubmission = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(event.currentTarget);
    const submissionId = String(formData.get("submission_id") ?? "");
    const grade = Number(formData.get("grade") ?? 0);
    const feedback = String(formData.get("feedback") ?? "").trim();
    const maxGrade = Number(formData.get("max_grade") ?? 0);

    if (!submissionId) {
      setActionError("Missing submission id.");
      return;
    }

    if (!Number.isFinite(grade) || grade < 0 || grade > maxGrade) {
      setActionError("Grade must be between 0 and the assignment max grade.");
      return;
    }

    setReviewingSubmissionId(submissionId);

    try {
      const { data, error } = await supabase
        .from("submissions")
        .update({
          grade: Math.round(grade),
          feedback,
          status: "reviewed",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select(
          "id, assignment_id, student_id, file_url, file_path, status, grade, feedback, submitted_at, reviewed_at, assignments(id, title, deadline, max_grade, course_id, courses(id, title)), profiles(id, full_name, email)"
        )
        .single();

      if (error) {
        throw error;
      }

      const updatedSubmission = normalizeSubmissionWithMeta(data as unknown as SubmissionWithMeta);
      setSubmissionRows((current) =>
        current.map((submission) => (submission.id === submissionId ? updatedSubmission : submission))
      );
      setStatusMessage("Submission reviewed.");
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save review.");
    } finally {
      setReviewingSubmissionId(null);
    }
  };

  const banner =
    mode === "teacher"
      ? {
          badge: "Teacher Workflow",
          title: "Assignment control center",
          description:
            "Create deadlines, publish instructions, review uploads, grade work, and return feedback in one place.",
          icon: ClipboardList,
          accent: "violet",
        }
      : {
          badge: "Student Workflow",
          title: "Assignment inbox",
          description:
            "Review active assignments, upload PDF work, and track grading feedback after submission.",
          icon: GraduationCap,
          accent: "cyan",
        };

  const BannerIcon = banner.icon;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6 md:p-7">
        <div
          className={`absolute inset-0 ${banner.accent === "violet" ? "bg-mesh-violet" : "bg-mesh-cyan"} opacity-35 pointer-events-none`}
        />
        <div className="grain-overlay" />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3 max-w-3xl">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                banner.accent === "violet"
                  ? "border-violet-500/20 bg-violet-500/10 text-violet-300"
                  : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
              }`}
            >
              <BannerIcon className="h-3.5 w-3.5" />
              {banner.badge}
            </span>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">{banner.title}</h1>
            <p className="max-w-2xl text-sm text-zinc-400">{banner.description}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3 text-xs text-zinc-300">
            <p className="font-bold text-white">{currentUserName}</p>
            <p className="mt-0.5 text-zinc-500">
              {mode === "teacher" ? "Teacher review hub" : "Student submission portal"}
            </p>
          </div>
        </div>
      </section>

      {actionError && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {actionError}
        </div>
      )}

      {statusMessage && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {statusMessage}
        </div>
      )}

      {mode === "teacher" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Assignments", value: teacherStats.assignments, icon: BookOpen, color: "text-violet-300", bg: "bg-mesh-violet" },
              { label: "Pending Reviews", value: teacherStats.pendingReviews, icon: MessageSquareText, color: "text-cyan-300", bg: "bg-mesh-cyan" },
              { label: "Reviewed", value: teacherStats.reviewed, icon: ShieldCheck, color: "text-emerald-300", bg: "bg-mesh-emerald" },
              { label: "Average Grade", value: teacherStats.avgGrade, icon: Star, color: "text-orange-300", bg: "bg-mesh-orange" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5"
                >
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
                <h2 className="text-sm font-bold text-white">Create Assignment</h2>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Deadline, instructions, grading cap
                </p>
              </div>
              <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                Teacher only
              </div>
            </div>

            <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2 lg:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Course</label>
                <select
                  name="course_id"
                  defaultValue=""
                  className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50"
                >
                  <option value="">General assignment</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 lg:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Title</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. React State Management Essay"
                  className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Instructions</label>
                <textarea
                  name="instructions"
                  required
                  rows={5}
                  placeholder="Explain the task, deliverables, and evaluation criteria..."
                  className="w-full resize-none rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Deadline</label>
                <input
                  name="deadline"
                  type="datetime-local"
                  required
                  className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Max Grade</label>
                <input
                  name="max_grade"
                  type="number"
                  min="1"
                  defaultValue="100"
                  required
                  className="w-full rounded-2xl border border-white/5 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="lg:col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Publish immediately</p>
                  <p className="text-[10px] text-zinc-500">
                    Students can see the assignment as soon as it is created.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isCreatingAssignment}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {isCreatingAssignment ? "Creating..." : "Create Assignment"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Assignments</h2>
              <span className="h-px flex-1 bg-white/5" />
            </div>

            {assignmentRows.length > 0 ? (
              <div className="space-y-5">
                {assignmentRows.map((assignment) => {
                  const assignmentSubmissions = submissionsByAssignment[assignment.id] ?? [];
                  const submitted = assignmentSubmissions.filter((submission) => submission.status === "submitted").length;
                  const reviewed = assignmentSubmissions.filter((submission) => submission.status === "reviewed").length;

                  return (
                    <article key={assignment.id} className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                      <div className="absolute inset-0 bg-mesh-violet opacity-20 pointer-events-none" />
                      <div className="grain-overlay" />
                      <div className="relative z-10 space-y-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                              <FileText className="h-3.5 w-3.5 text-violet-400" />
                              {getAssignmentCourseTitle(assignment)}
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-white">{assignment.title}</h3>
                            <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">{assignment.instructions}</p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3 md:min-w-[300px]">
                            <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Deadline</p>
                              <p className="mt-1 text-sm font-bold text-white">{formatDate(assignment.deadline)}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Max Grade</p>
                              <p className="mt-1 text-sm font-bold text-white">{assignment.max_grade}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Submissions</p>
                              <p className="mt-1 text-sm font-bold text-white">{assignmentSubmissions.length}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
                          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
                            {submitted} submitted
                          </span>
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                            {reviewed} reviewed
                          </span>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Student uploads</h4>
                          {assignmentSubmissions.length > 0 ? (
                            <div className="space-y-3">
                              {assignmentSubmissions.map((submission) => (
                                <form
                                  key={submission.id}
                                  onSubmit={handleReviewSubmission}
                                  className="rounded-2xl border border-white/5 bg-zinc-950/40 p-4"
                                >
                                  <input type="hidden" name="submission_id" value={submission.id} />
                                  <input type="hidden" name="max_grade" value={assignment.max_grade} />
                                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                        <Users className="h-4 w-4 text-zinc-500" />
                                        {submission.profiles?.full_name || submission.profiles?.email || "Student"}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                                          Submitted {formatDate(submission.submitted_at)}
                                        </span>
                                        <a
                                          href={submission.file_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-violet-300 transition hover:text-white"
                                        >
                                          <Paperclip className="h-3 w-3" />
                                          Open PDF
                                        </a>
                                        <span
                                          className={`rounded-full border px-2.5 py-1 ${
                                            submission.status === "reviewed"
                                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                              : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                                          }`}
                                        >
                                          {submission.status === "reviewed" ? "Reviewed" : "Pending review"}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-[120px_1fr] xl:min-w-[440px]">
                                      <label className="space-y-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Grade</span>
                                        <input
                                          name="grade"
                                          type="number"
                                          min="0"
                                          max={assignment.max_grade}
                                          required
                                          defaultValue={submission.grade ?? ""}
                                          className="w-full rounded-2xl border border-white/5 bg-zinc-900/50 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                                        />
                                      </label>
                                      <label className="space-y-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                          Feedback
                                        </span>
                                        <textarea
                                          name="feedback"
                                          rows={3}
                                          defaultValue={submission.feedback ?? ""}
                                          placeholder="Leave detailed feedback for the student..."
                                          className="w-full resize-none rounded-2xl border border-white/5 bg-zinc-900/50 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                                        />
                                      </label>
                                    </div>
                                  </div>

                                  <div className="mt-3 flex items-center justify-end gap-3">
                                    {submission.status === "reviewed" && submission.reviewed_at && (
                                      <span className="mr-auto text-[10px] font-semibold text-zinc-500">
                                        Reviewed {formatDate(submission.reviewed_at)}
                                      </span>
                                    )}
                                    <button
                                      type="submit"
                                      disabled={reviewingSubmissionId === submission.id}
                                      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-cyan-700 disabled:opacity-50"
                                    >
                                      {reviewingSubmissionId === submission.id ? "Saving..." : "Save Review"}
                                      <Send className="h-4 w-4" />
                                    </button>
                                  </div>
                                </form>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/30 px-4 py-6 text-sm text-zinc-500">
                              No student uploads yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center text-sm text-zinc-500">
                No assignments have been created yet.
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Visible Assignments", value: studentStats.visibleAssignments, icon: ClipboardList, color: "text-violet-300", bg: "bg-mesh-violet" },
              { label: "Submitted", value: studentStats.submitted, icon: UploadCloud, color: "text-cyan-300", bg: "bg-mesh-cyan" },
              { label: "Reviewed", value: studentStats.reviewed, icon: CheckCircle2, color: "text-emerald-300", bg: "bg-mesh-emerald" },
              { label: "Pending", value: studentStats.pending, icon: MessageSquareText, color: "text-orange-300", bg: "bg-mesh-orange" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5"
                >
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

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Available Assignments</h2>
              <span className="h-px flex-1 bg-white/5" />
            </div>

            {visibleAssignments.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {visibleAssignments.map((assignment) => {
                  const mySubmission =
                    studentSubmissions.find((submission) => submission.assignment_id === assignment.id) ?? null;
                  const reviewed = mySubmission?.status === "reviewed";

                  return (
                    <article key={assignment.id} className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                      <div className="absolute inset-0 bg-mesh-cyan opacity-20 pointer-events-none" />
                      <div className="grain-overlay" />
                      <div className="relative z-10 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                              <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                              {getAssignmentCourseTitle(assignment)}
                            </div>
                            <h3 className="text-xl font-black tracking-tight text-white">{assignment.title}</h3>
                            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">{assignment.instructions}</p>
                          </div>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                            Due {formatShortDate(assignment.deadline)}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Max Grade</p>
                            <p className="mt-1 text-sm font-bold text-white">{assignment.max_grade}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</p>
                            <p className="mt-1 text-sm font-bold text-white">
                              {reviewed ? "Reviewed" : mySubmission ? "Submitted" : "Not submitted"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">File</p>
                            <p className="mt-1 text-sm font-bold text-white">PDF only</p>
                          </div>
                        </div>

                        {mySubmission && (
                          <div
                            className={`rounded-2xl border px-4 py-3 text-sm ${
                              reviewed
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                                : "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold">
                              {reviewed ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                              {reviewed
                                ? `Reviewed: ${mySubmission.grade ?? 0}/${assignment.max_grade}`
                                : "Submission received and waiting for review."}
                            </div>
                            {mySubmission.feedback && (
                              <p className="mt-2 text-xs leading-relaxed opacity-90">{mySubmission.feedback}</p>
                            )}
                            <p className="mt-2 text-[10px] uppercase tracking-widest opacity-70">
                              Submitted {formatDate(mySubmission.submitted_at)}
                            </p>
                          </div>
                        )}

                        <form onSubmit={handleSubmitAssignment} className="space-y-4 rounded-2xl border border-white/5 bg-zinc-950/40 p-4">
                          <input type="hidden" name="assignment_id" value={assignment.id} />
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            <UploadCloud className="h-3.5 w-3.5 text-cyan-400" />
                            Upload PDF submission
                          </div>
                          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-zinc-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/5">
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              <Paperclip className="h-4 w-4 text-cyan-300" />
                              Choose a PDF file
                            </span>
                            <input type="file" name="file" accept="application/pdf,.pdf" className="hidden" required />
                          </label>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] text-zinc-500">
                              Files are stored in the submission bucket and shared with your teacher.
                            </p>
                            <button
                              type="submit"
                              disabled={submittingAssignmentId === assignment.id}
                              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 px-4 py-2.5 text-xs font-black text-zinc-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-50"
                            >
                              {submittingAssignmentId === assignment.id ? "Submitting..." : mySubmission ? "Resubmit PDF" : "Submit PDF"}
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        </form>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center text-sm text-zinc-500">
                No assignments are available for your enrolled courses yet.
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">My Submissions</h2>
              <span className="h-px flex-1 bg-white/5" />
            </div>

            {studentSubmissions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {studentSubmissions.map((submission) => (
                  <article key={submission.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">{getSubmissionAssignmentTitle(submission)}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">
                          {getAssignmentCourseTitle(submission.assignments ?? null)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                          submission.status === "reviewed"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                        }`}
                      >
                        {submission.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                        Submitted {formatDate(submission.submitted_at)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/5 bg-zinc-950/40 p-4 text-sm text-zinc-300">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Uploaded file</p>
                      <a
                        href={submission.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-2 text-cyan-300 transition hover:text-white"
                      >
                        <Paperclip className="h-4 w-4" />
                        Open submitted PDF
                      </a>
                    </div>

                    {submission.status === "reviewed" && (
                      <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                        <div className="flex items-center gap-2 font-bold">
                          <CheckCircle2 className="h-4 w-4" />
                          Grade {submission.grade ?? 0}
                        </div>
                        {submission.feedback && <p className="mt-2 text-xs leading-relaxed">{submission.feedback}</p>}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center text-sm text-zinc-500">
                You have not submitted any assignments yet.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
