"use client";

import React, { useState } from "react";
import { Check, Eye, EyeOff, Globe, Lock, Save, ShieldCheck, Users } from "lucide-react";
import { UserSettings } from "@/types/settings";
import { saveUserSettingsPartial } from "@/lib/settings/actions";

interface PrivacySettingsProps {
  settings: UserSettings;
}

export default function PrivacySettings({ settings }: PrivacySettingsProps) {
  const [visibility, setVisibility] = useState(settings.profile_visibility || "public");
  const [showProgress, setShowProgress] = useState(settings.show_learning_progress ?? true);
  const [showCertificates, setShowCertificates] = useState(settings.show_certificates ?? true);
  const [showAchievements, setShowAchievements] = useState(settings.show_achievements ?? true);
  const [onlineStatus, setOnlineStatus] = useState(settings.show_online_status ?? true);
  const [discovery, setDiscovery] = useState(settings.allow_discovery ?? true);
  const [dataSharing, setDataSharing] = useState(settings.data_sharing ?? false);

  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveUserSettingsPartial({
      profile_visibility: visibility as any,
      show_learning_progress: showProgress,
      show_certificates: showCertificates,
      show_achievements: showAchievements,
      show_online_status: onlineStatus,
      allow_discovery: discovery,
      data_sharing: dataSharing,
    });
    setIsSaving(false);
    if (res.success) {
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-8">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" /> Profile Visibility Level
          </h3>
          <p className="text-xs text-zinc-400 mt-1">Control who can discover and view your public profile.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {[
              { id: "public", title: "Public", desc: "Visible to everyone on the web", icon: Globe },
              { id: "students_only", title: "Students Only", desc: "Visible only to enrolled platform peers", icon: Users },
              { id: "private", title: "Private", desc: "Only visible to you and instructors", icon: Lock },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = visibility === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVisibility(opt.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-cyan-400/60 bg-cyan-400/10 shadow-lg shadow-cyan-500/10"
                      : "border-white/5 bg-zinc-900/40 hover:border-white/10"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-cyan-300" : "text-zinc-500"}`} />
                  <div className="text-xs font-bold text-white mt-2">{opt.title}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Sharing Toggles */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-violet-400" /> Learning Telemetry & Exposure
          </h3>

          <div className="divide-y divide-white/5">
            {[
              {
                title: "Display Course Progress",
                desc: "Show lesson completion percentages on public cards and community leaderboards.",
                val: showProgress,
                set: setShowProgress,
              },
              {
                title: "Display Verified Certificates",
                desc: "Allow prospective employers and peers to view and verify completed course certificates.",
                val: showCertificates,
                set: setShowCertificates,
              },
              {
                title: "Display Quiz Badges & Achievements",
                desc: "Highlight high test scores and learning streaks on your community profile.",
                val: showAchievements,
                set: setShowAchievements,
              },
              {
                title: "Show Active Online Presence",
                desc: "Display a green active indicator when you are actively watching lessons.",
                val: onlineStatus,
                set: setOnlineStatus,
              },
              {
                title: "Allow Student & Instructor Discovery",
                desc: "Appear in peer search for study groups and collaboration hubs.",
                val: discovery,
                set: setDiscovery,
              },
              {
                title: "Anonymous Learning Analytics Sharing",
                desc: "Help instructors improve curriculum design by sharing anonymized quiz completion data.",
                val: dataSharing,
                set: setDataSharing,
              },
            ].map((item, idx) => (
              <label key={idx} className="py-3.5 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">{item.title}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={item.val}
                  onChange={(e) => item.set(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-400 ml-4 shrink-0"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {savedFeedback ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Privacy settings updated!
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Your privacy choices take effect immediately.</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Privacy Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
