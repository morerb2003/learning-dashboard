"use client";

import React, { useState } from "react";
import { Sparkles, Send, X, Bot, CheckCircle2, ArrowRight, Loader2, Zap } from "lucide-react";
import type { AiTutorResponse } from "@/lib/ai/service";

interface AiTutorDrawerProps {
  courseTitle: string;
  lessonTitle: string;
}

export default function AiTutorDrawer({
  courseTitle,
  lessonTitle,
}: AiTutorDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AiTutorResponse | null>(null);
  const [isCachedResult, setIsCachedResult] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle,
          lessonTitle,
          question: question.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response.");
      }

      setResponse(data.result);
      setIsCachedResult(Boolean(data.cached));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "Explain the core concept in simple terms",
    "What are common pitfalls to avoid?",
    "Give me 3 practice tips for this lesson",
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-4 py-3 text-xs font-black text-white shadow-2xl shadow-violet-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
      >
        <Sparkles className="h-4 w-4 text-cyan-300 animate-pulse" />
        <span>Ask AI Tutor</span>
      </button>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-zinc-950 p-6 shadow-2xl sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/25">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-white">AURA AI Study Tutor</h2>
                    <span className="flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[9px] font-black text-cyan-300">
                      <Zap className="h-2.5 w-2.5" /> Redis Cached
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate max-w-[280px]">
                    {lessonTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto py-5 space-y-4">
              {!response && !loading && (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center">
                  <Bot className="mx-auto h-8 w-8 text-violet-400 mb-2 opacity-80" />
                  <h3 className="text-xs font-black text-white">Ask anything about this lesson</h3>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Get instant concept breakdowns, code explanations, and key study takeaways.
                  </p>

                  <div className="mt-4 flex flex-col gap-2">
                    {sampleQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuestion(q);
                        }}
                        className="text-left rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2 text-xs text-zinc-300 hover:border-violet-500/40 hover:text-white transition cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="h-8 w-8 text-violet-400 animate-spin mb-3" />
                  <p className="text-xs font-bold text-zinc-300">Consulting AI Knowledge Base...</p>
                  <p className="text-[11px] text-zinc-500">Checking Redis cache & synthesizing response</p>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
                  {error}
                </div>
              )}

              {response && !loading && (
                <div className="space-y-4">
                  {/* Cached Badge */}
                  {isCachedResult && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-[10px] font-bold text-cyan-300">
                      <Zap className="h-3 w-3" /> Served instantly from Redis Cache
                    </div>
                  )}

                  {/* Answer card */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-zinc-200">
                    <p className="font-semibold text-white mb-2">Tutor Explanation:</p>
                    {response.answer}
                  </div>

                  {/* Takeaways */}
                  {response.keyTakeaways.length > 0 && (
                    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-4">
                      <h4 className="text-xs font-black text-violet-300 mb-2.5">Key Study Takeaways</h4>
                      <ul className="space-y-2">
                        {response.keyTakeaways.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] text-zinc-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendation */}
                  {response.recommendedAction && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3.5 flex items-center gap-2.5 text-xs text-emerald-300">
                      <ArrowRight className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{response.recommendedAction}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAsk} className="pt-3 border-t border-white/10">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about this lesson..."
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-4 pr-12 text-xs text-white placeholder-zinc-500 outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || loading}
                  className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white disabled:opacity-40 hover:brightness-110 active:scale-95 transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
