"use client";

import { useTransition, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { markLessonComplete } from "@/lib/course/progress";

interface MarkCompleteButtonProps {
  lessonId: string;
  courseId: string;
  initialCompleted: boolean;
}

export default function MarkCompleteButton({
  lessonId,
  courseId,
  initialCompleted,
}: MarkCompleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCompleted, setOptimisticCompleted] =
    useState(initialCompleted);

  const handleClick = () => {
    if (optimisticCompleted) return;

    // Optimistic update — flip immediately
    setOptimisticCompleted(true);

    startTransition(async () => {
      const result = await markLessonComplete(lessonId, courseId);
      // If the server action failed, revert
      if (result?.error) {
        setOptimisticCompleted(false);
        console.error("markLessonComplete error:", result.error);
      }
    });
  };

  if (optimisticCompleted) {
    return (
      <div className="flex items-center justify-center gap-2 w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-xs font-bold text-emerald-300 animate-in fade-in duration-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Lesson Completed
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-xs font-bold text-cyan-300 transition-all hover:border-cyan-400/50 hover:bg-cyan-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Saving...
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
          Mark as Complete
        </>
      )}
    </button>
  );
}
