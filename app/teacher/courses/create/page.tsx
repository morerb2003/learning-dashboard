"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, BookOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";

const colors = ["violet", "cyan", "emerald", "orange"] as const;
const levels = ["Beginner", "Intermediate", "Advanced"] as const;
const icons = ["Atom", "Network", "Sparkles", "Database", "Code", "BookOpen", "Layers"] as const;

export default function CreateCoursePage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<typeof levels[number]>("Beginner");
  const [iconName, setIconName] = useState<typeof icons[number]>("BookOpen");
  const [teacherName, setTeacherName] = useState("");
  const [color, setColor] = useState<typeof colors[number]>("violet");
  const [isPublished, setIsPublished] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    setError(null);

    const { data, error: saveError } = await supabase
      .from("courses")
      .insert([{
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        level,
        icon_name: iconName,
        teacher_name: teacherName.trim() || null,
        color,
        progress: 0,
        is_published: isPublished,
      }])
      .select()
      .single();

    setIsSaving(false);

    if (saveError) {
      setError(saveError.message);
    } else if (data) {
      router.push("/teacher/courses");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/teacher/courses"
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Courses
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          Create New Course
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Fill in the details below to publish a new course to the catalog.
        </p>
      </div>

      {/* Form */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="absolute inset-0 bg-mesh-violet opacity-20 pointer-events-none" />
        <div className="grain-overlay" />

        <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-300">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next.js App Router Architecture"
              className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed curriculum overview..."
              className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          {/* Category + Level */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Frontend Architecture"
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as typeof levels[number])}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50 transition-colors"
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Icon + Instructor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Icon
              </label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value as typeof icons[number])}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50 transition-colors"
              >
                {icons.map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Lead Instructor
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="e.g. Dr. Alex Vance"
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Color Accent
            </label>
            <div className="flex gap-3">
              {colors.map((c) => {
                const colorDots: Record<string, string> = {
                  violet: "bg-violet-500",
                  cyan: "bg-cyan-500",
                  emerald: "bg-emerald-500",
                  orange: "bg-orange-500",
                };
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full ${colorDots[c]} transition-all cursor-pointer ${
                      color === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110" : "opacity-60 hover:opacity-90"
                    }`}
                    title={c}
                  />
                );
              })}
            </div>
          </div>

          {/* Publish toggle */}
          <div className="flex items-center justify-between py-3 border-t border-white/5">
            <div>
              <p className="text-xs font-semibold text-white">Publish Immediately</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Toggle catalog visibility</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-colors cursor-pointer ${
                isPublished ? "bg-emerald-600 justify-end" : "bg-zinc-800 justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20 cursor-pointer"
          >
            {isSaving ? (
              "Creating Course..."
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {isPublished ? "Publish Course" : "Save as Draft"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
