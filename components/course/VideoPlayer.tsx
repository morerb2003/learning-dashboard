"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoLesson {
  id: string;
  title: string;
  lesson_order: number;
  video_url: string | null;
}

interface VideoPlayerProps {
  /** The lesson currently being viewed */
  lesson: VideoLesson;
  /** All lessons in this course, sorted by lesson_order */
  allLessons: VideoLesson[];
  /** The parent course id, used to construct navigation hrefs */
  courseId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type VideoType = "youtube" | "vimeo" | "iframe" | null;

interface ParsedVideo {
  type: VideoType;
  embedUrl: string | null;
}

function parseVideoUrl(raw: string | null): ParsedVideo {
  if (!raw) return { type: null, embedUrl: null };

  try {
    const url = new URL(raw);

    // YouTube short-link: https://youtu.be/<id>
    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.slice(1);
      return {
        type: "youtube",
        embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
      };
    }

    // YouTube full: https://www.youtube.com/watch?v=<id>
    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (videoId) {
        return {
          type: "youtube",
          embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
        };
      }
      // Already an embed URL
      if (url.pathname.startsWith("/embed/")) {
        return { type: "youtube", embedUrl: raw };
      }
    }

    // Vimeo: https://vimeo.com/<id>  or  https://player.vimeo.com/video/<id>
    if (url.hostname === "vimeo.com") {
      const videoId = url.pathname.replace("/", "");
      if (videoId && /^\d+$/.test(videoId)) {
        return {
          type: "vimeo",
          embedUrl: `https://player.vimeo.com/video/${videoId}?dnt=1&title=0&byline=0&portrait=0`,
        };
      }
    }
    if (url.hostname === "player.vimeo.com") {
      return { type: "vimeo", embedUrl: raw };
    }

    // Fallback: treat as a generic embeddable iframe
    return { type: "iframe", embedUrl: raw };
  } catch {
    return { type: null, embedUrl: null };
  }
}

// ─── Sub-component: Platform badge ───────────────────────────────────────────

function PlatformBadge({ type }: { type: VideoType }) {
  if (!type) return null;

  const styles: Record<NonNullable<VideoType>, string> = {
    youtube: "border-red-500/30 bg-red-500/10 text-red-300",
    vimeo: "border-sky-400/30 bg-sky-400/10 text-sky-300",
    iframe: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  };

  const labels: Record<NonNullable<VideoType>, string> = {
    youtube: "YouTube",
    vimeo: "Vimeo",
    iframe: "External",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${styles[type]}`}
    >
      {type === "youtube" && (
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )}
      {type === "vimeo" && (
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
          <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.787 4.789.968 5.507.537 2.45 1.13 3.674 1.783 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.476 4.807z" />
        </svg>
      )}
      {labels[type]}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VideoPlayer({
  lesson,
  allLessons,
  courseId,
}: VideoPlayerProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const { type, embedUrl } = parseVideoUrl(lesson.video_url);

  // Reset iframe loading state when lesson changes
  useEffect(() => {
    setIframeLoaded(false);
  }, [lesson.id]);

  const navigate = useCallback(
    (targetLesson: VideoLesson) => {
      setIsNavigating(true);
      router.push(`/course/${courseId}/lesson/${targetLesson.id}`);
    },
    [courseId, router]
  );

  // Keyboard navigation ← →
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prevLesson) navigate(prevLesson);
      if (e.key === "ArrowRight" && nextLesson) navigate(nextLesson);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, prevLesson, nextLesson]);

  return (
    <div className="space-y-0 rounded-3xl overflow-hidden glass-card relative">
      <div className="grain-overlay" />

      {/* ── Video frame ─────────────────────────────────────────────────────── */}
      <div className="relative aspect-video bg-zinc-950">
        {/* Gradient overlay — only shows while loading or when no video */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-zinc-950/60 to-cyan-900/20 pointer-events-none" />

        {embedUrl ? (
          <>
            {/* Loading shimmer */}
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                <p className="text-xs text-zinc-500 font-medium">
                  Loading {type === "youtube" ? "YouTube" : type === "vimeo" ? "Vimeo" : "video"}…
                </p>
              </div>
            )}
            <iframe
              key={lesson.id} // remount when lesson changes
              src={embedUrl}
              title={lesson.title}
              className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
                iframeLoaded ? "opacity-100" : "opacity-0"
              }`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              onLoad={() => setIframeLoaded(true)}
            />
          </>
        ) : (
          /* No video placeholder */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center backdrop-blur-sm">
                <PlayCircle className="h-10 w-10 text-zinc-600" />
              </div>
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-ping" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-300">No video attached</p>
              <p className="mt-1 text-xs text-zinc-600">
                Add a YouTube or Vimeo URL in the admin lesson editor.
              </p>
            </div>
          </div>
        )}

        {/* Platform badge (top-left) */}
        {type && (
          <div className="absolute top-3 left-3 z-20">
            <PlatformBadge type={type} />
          </div>
        )}

        {/* Open-in-source button (top-right) */}
        {lesson.video_url && (
          <a
            href={lesson.video_url}
            target="_blank"
            rel="noreferrer"
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/50 px-2.5 py-1.5 text-[10px] font-bold text-zinc-300 backdrop-blur-sm transition hover:border-white/20 hover:text-white"
          >
            <ExternalLink className="h-3 w-3" />
            Source
          </a>
        )}

        {/* Lesson counter chip (bottom-left) */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/50 px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 backdrop-blur-sm">
          Lesson {lesson.lesson_order}
          <span className="text-zinc-600">·</span>
          {currentIndex + 1} / {allLessons.length}
        </div>

        {/* Navigating overlay */}
        {isNavigating && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        )}
      </div>

      {/* ── Lesson title bar ────────────────────────────────────────────────── */}
      <div className="relative z-10 border-t border-white/5 bg-zinc-900/40 px-5 py-4 backdrop-blur-sm">
        <h2 className="text-sm font-bold text-white leading-snug line-clamp-1">
          {lesson.title}
        </h2>
        {lesson.video_url && (
          <p className="mt-0.5 text-[11px] text-zinc-500 capitalize">{type} · {lesson.video_url}</p>
        )}
      </div>

      {/* ── Navigation bar ──────────────────────────────────────────────────── */}
      <div className="relative z-10 grid grid-cols-2 divide-x divide-white/5 border-t border-white/5">
        {/* ← Previous */}
        <button
          onClick={() => prevLesson && navigate(prevLesson)}
          disabled={!prevLesson || isNavigating}
          className="group flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-violet-500/5 disabled:cursor-not-allowed disabled:opacity-35"
          title={prevLesson ? `Previous: ${prevLesson.title}` : "No previous lesson"}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] transition-all group-hover:border-violet-500/30 group-hover:bg-violet-500/10 group-disabled:border-white/5 group-disabled:bg-transparent">
            <ChevronLeft className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-violet-300 group-disabled:text-zinc-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Previous
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-zinc-400 transition-colors group-hover:text-white">
              {prevLesson?.title ?? "Start of course"}
            </p>
          </div>
        </button>

        {/* → Next */}
        <button
          onClick={() => nextLesson && navigate(nextLesson)}
          disabled={!nextLesson || isNavigating}
          className="group flex items-center justify-end gap-3 px-5 py-4 text-right transition-colors hover:bg-cyan-500/5 disabled:cursor-not-allowed disabled:opacity-35"
          title={nextLesson ? `Next: ${nextLesson.title}` : "No next lesson"}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Next
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-zinc-400 transition-colors group-hover:text-white">
              {nextLesson?.title ?? "End of course"}
            </p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] transition-all group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 group-disabled:border-white/5 group-disabled:bg-transparent">
            <ChevronRight className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-cyan-300 group-disabled:text-zinc-700" />
          </div>
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="relative z-10 border-t border-white/5 bg-zinc-900/20 py-2 text-center">
        <p className="text-[10px] text-zinc-700 font-medium tracking-wide">
          Use{" "}
          <kbd className="rounded border border-white/5 bg-white/5 px-1.5 py-0.5 font-mono text-zinc-500">
            ←
          </kbd>{" "}
          /{" "}
          <kbd className="rounded border border-white/5 bg-white/5 px-1.5 py-0.5 font-mono text-zinc-500">
            →
          </kbd>{" "}
          to navigate between lessons
        </p>
      </div>
    </div>
  );
}
