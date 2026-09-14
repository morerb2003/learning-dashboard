"use client";

import React, { useState } from "react";
import { BookOpen, Check, Clock, Save, Sparkles, Tag, Target } from "lucide-react";
import { UserSettings } from "@/types/settings";
import { saveUserSettingsPartial } from "@/lib/settings/actions";

interface StudentSettingsProps {
  settings: UserSettings;
}

export default function StudentSettings({ settings }: StudentSettingsProps) {
  const [difficulty, setDifficulty] = useState(settings.difficulty_preference || "all");
  const [dailyMinutes, setDailyMinutes] = useState(settings.daily_study_target_minutes || 30);
  const [reminderTime, setReminderTime] = useState(settings.daily_reminder_time || "19:00");
  const [recommendations, setRecommendations] = useState(settings.course_recommendations ?? true);
  const [subjects, setSubjects] = useState<string[]>(
    settings.preferred_subjects || ["Web Development", "Computer Science", "Cloud Architecture"]
  );
  const [newSubject, setNewSubject] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveUserSettingsPartial({
      difficulty_preference: difficulty as any,
      daily_study_target_minutes: Number(dailyMinutes),
      daily_reminder_time: reminderTime,
      preferred_subjects: subjects,
      course_recommendations: recommendations,
    });
    setIsSaving(false);
    if (res.success) {
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    }
  };

  const addSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const removeSubject = (item: string) => {
    setSubjects(subjects.filter((s) => s !== item));
  };

  return (
    <div className="space-y-6">
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-8">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" /> Learning Habits & Daily Targets
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Personalize your study rhythm and automated milestone reminders.
          </p>
        </div>

        {/* Daily Study Target */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Daily Study Goal</span>
            <span className="text-sm font-black text-cyan-300">{dailyMinutes} Minutes / Day</span>
          </div>
          <div className="flex gap-2">
            {[15, 30, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDailyMinutes(mins)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  dailyMinutes === mins
                    ? "bg-cyan-400 text-zinc-950 shadow-md"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Daily Reminder Time & Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Daily Reminder Alarm</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Preferred Course Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full h-11 px-3 rounded-2xl bg-zinc-900/60 border border-white/10 text-xs text-white focus:outline-none"
            >
              <option value="all">All Levels (Balanced Discovery)</option>
              <option value="beginner">Beginner Friendly</option>
              <option value="intermediate">Intermediate Developers</option>
              <option value="advanced">Advanced Architecture & Mastery</option>
            </select>
          </div>
        </div>

        {/* Preferred Subjects */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Subject Interests for Recommendations
          </label>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-xs font-bold text-cyan-300"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSubject(s)}
                  className="text-zinc-500 hover:text-rose-400 ml-1"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-md pt-1">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
              placeholder="Add interest (e.g. AI, DevOps, Rust)..."
              className="flex-1 h-10 px-4 rounded-xl bg-zinc-900/60 border border-white/10 text-xs text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={addSubject}
              className="px-4 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
            >
              Add
            </button>
          </div>
        </div>

        {/* Personalized Recommendations Toggle */}
        <div className="pt-4 border-t border-white/5">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-xs font-bold text-white">AI Course & Quiz Recommendations</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Display curated learning recommendations based on completed courses and test scores.
              </div>
            </div>
            <input
              type="checkbox"
              checked={recommendations}
              onChange={(e) => setRecommendations(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-400 ml-4 shrink-0"
            />
          </label>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {savedFeedback ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Learning habits saved!
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Your study dashboard adapts to these settings.</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Learning Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
