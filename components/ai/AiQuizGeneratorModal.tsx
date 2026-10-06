"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, X, PlusCircle, Check, Copy, HelpCircle } from "lucide-react";
import type { GeneratedQuiz } from "@/lib/ai/service";

interface AiQuizGeneratorModalProps {
  courseTitle?: string;
  onUseQuiz?: (quiz: GeneratedQuiz) => void;
}

export default function AiQuizGeneratorModal({
  courseTitle,
  onUseQuiz,
}: AiQuizGeneratorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [count, setCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/quiz-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          courseTitle,
          difficulty,
          count,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate quiz.");
      }

      setGeneratedQuiz(data.quiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!generatedQuiz) return;
    navigator.clipboard.writeText(JSON.stringify(generatedQuiz, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-violet-500/20 hover:brightness-110 active:scale-95 transition cursor-pointer border border-white/20"
      >
        <Sparkles className="h-4 w-4 text-cyan-300" />
        <span>Generate Quiz with AI</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl sm:p-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/25">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">AI Quiz Generator</h3>
                  <p className="text-[11px] text-zinc-400">Generate interactive quizzes powered by AI and Redis caching</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-5">
              {!generatedQuiz ? (
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Quiz Topic or Key Concept
                    </label>
                    <input
                      type="text"
                      required
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Next.js 16 App Router, SQL Indexes, TypeScript Types..."
                      className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs text-white placeholder-zinc-500 outline-none focus:border-violet-400/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                        Target Difficulty
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as "beginner" | "intermediate" | "advanced")}
                        className="h-11 w-full rounded-2xl border border-white/10 bg-zinc-900 px-3 text-xs text-white outline-none focus:border-violet-400/50"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                        Question Count
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={count}
                        onChange={(e) => setCount(parseInt(e.target.value, 10) || 4)}
                        className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs text-white outline-none focus:border-violet-400/50"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !topic.trim()}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-xs font-black text-white shadow-xl shadow-violet-600/30 hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{loading ? "Synthesizing Quiz Questions..." : "Generate Quiz Questions"}</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-4">
                    <div>
                      <h4 className="text-sm font-black text-white">{generatedQuiz.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{generatedQuiz.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {onUseQuiz && (
                        <button
                          type="button"
                          onClick={() => {
                            onUseQuiz(generatedQuiz);
                            setIsOpen(false);
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:brightness-110 transition cursor-pointer"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          <span>Use in Builder</span>
                        </button>
                      )}
                      <button
                        onClick={handleCopyJson}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? "Copied" : "Copy JSON"}</span>
                      </button>
                      <button
                        onClick={() => setGeneratedQuiz(null)}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                      >
                        New Quiz
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {generatedQuiz.questions.map((q, qIdx) => (
                      <div key={qIdx} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
                        <div className="flex items-start gap-2">
                          <HelpCircle className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                          <h5 className="text-xs font-bold text-white">
                            {qIdx + 1}. {q.question}
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`rounded-xl px-3 py-2 text-xs border ${
                                optIdx === q.correctIndex
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 font-bold"
                                  : "border-white/5 bg-white/[0.02] text-zinc-400"
                              }`}
                            >
                              <span className="opacity-60 mr-1.5">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              {opt}
                            </div>
                          ))}
                        </div>

                        <p className="text-[11px] text-zinc-400 italic pt-1 border-t border-white/5">
                          💡 Explanation: {q.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
              <span>All requests protected by Upstash Redis rate limiting & cache</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
