"use client";

import { useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import type { CourseReview } from "@/types/review";
import { deleteCourseReview, saveCourseReview } from "@/lib/course/reviews";

interface CourseReviewsProps {
  courseId: string;
  reviews: CourseReview[];
  currentUserId: string;
  canReview: boolean;
}

export default function CourseReviews({
  courseId,
  reviews,
  currentUserId,
  canReview,
}: CourseReviewsProps) {
  const ownReview = reviews.find((review) => review.student_id === currentUserId);
  const [rating, setRating] = useState(ownReview?.rating ?? 5);
  const [review, setReview] = useState(ownReview?.review ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
      : 0;

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveCourseReview(courseId, rating, review);
      setMessage(result.error ?? "Review saved.");
    });
  };

  const remove = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteCourseReview(courseId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setReview("");
      setRating(5);
      setMessage("Review removed.");
    });
  };

  return (
    <section className="relative overflow-hidden rounded-3xl glass-card p-6">
      <div className="absolute inset-0 bg-mesh-orange opacity-20 pointer-events-none" />
      <div className="grain-overlay" />
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-black text-white">Student Reviews</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Feedback from verified enrolled learners.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
            <span className="text-2xl font-black text-white">{average.toFixed(1)}</span>
            <span className="text-xs text-zinc-500">({reviews.length})</span>
          </div>
        </div>

        {canReview && (
          <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-white">
                {ownReview ? "Update your review" : "Rate this course"}
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`${value} star rating`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        value <= rating
                          ? "fill-amber-300 text-amber-300"
                          : "text-zinc-700"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={review}
              onChange={(event) => setReview(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="What helped you learn?"
              className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-400/40"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">{message}</span>
              <div className="flex gap-2">
                {ownReview && (
                  <button
                    type="button"
                    onClick={remove}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  onClick={submit}
                  disabled={isPending || review.trim().length < 3}
                  className="rounded-xl bg-amber-300 px-4 py-2 text-xs font-black text-zinc-950 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Review"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {reviews.length > 0 ? (
            reviews.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-white">
                    {item.profiles?.full_name || "AURA Student"}
                  </p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className={`h-3.5 w-3.5 ${
                          value <= item.rating
                            ? "fill-amber-300 text-amber-300"
                            : "text-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">
                  {item.review}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No reviews yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
