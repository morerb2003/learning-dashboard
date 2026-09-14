"use client";

import React, { useState } from "react";
import { Check, Eye, Keyboard, Move, Save, Sparkles, Volume2 } from "lucide-react";
import { UserSettings } from "@/types/settings";
import { saveUserSettingsPartial } from "@/lib/settings/actions";

interface AccessibilitySettingsProps {
  settings: UserSettings;
}

export default function AccessibilitySettings({ settings }: AccessibilitySettingsProps) {
  const [keyboardNav, setKeyboardNav] = useState(settings.keyboard_navigation ?? true);
  const [reducedMotion, setReducedMotion] = useState(settings.reduced_motion ?? false);
  const [highContrast, setHighContrast] = useState(settings.high_contrast ?? false);
  const [screenReaderCues, setScreenReaderCues] = useState(settings.screen_reader_cues ?? false);
  const [textScaling, setTextScaling] = useState(settings.text_scaling || 100);

  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveUserSettingsPartial({
      keyboard_navigation: keyboardNav,
      reduced_motion: reducedMotion,
      high_contrast: highContrast,
      screen_reader_cues: screenReaderCues,
      text_scaling: Number(textScaling),
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
            <Sparkles className="w-4 h-4 text-cyan-400" /> Accessibility & Assistive Controls
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Tailor the platform interface for visual comfort, mobility, and screen-reading equipment.
          </p>
        </div>

        {/* Sliders & Controls */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Interface Text Scaling</span>
              <span className="text-xs font-mono font-bold text-cyan-300">{textScaling}%</span>
            </div>
            <input
              type="range"
              min={80}
              max={140}
              step={5}
              value={textScaling}
              onChange={(e) => setTextScaling(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>80% (Compact)</span>
              <span>100% (Default)</span>
              <span>140% (Large)</span>
            </div>
          </div>

          <div className="divide-y divide-white/5 pt-2">
            {[
              {
                title: "Enhanced Keyboard Navigation",
                desc: "Renders pronounced high-visibility focus rings and enables tab navigation jump links.",
                val: keyboardNav,
                set: setKeyboardNav,
                icon: Keyboard,
              },
              {
                title: "Reduce Motion & Flashing",
                desc: "Disables background particle pulses and smooth transitions for vestibular comfort.",
                val: reducedMotion,
                set: setReducedMotion,
                icon: Move,
              },
              {
                title: "High Contrast Mode",
                desc: "Amplifies contrast boundaries on text, cards, and buttons for low-vision clarity.",
                val: highContrast,
                set: setHighContrast,
                icon: Eye,
              },
              {
                title: "Screen Reader Verbosity Cues",
                desc: "Appends extra descriptive aria-live regions for video player status and quiz timers.",
                val: screenReaderCues,
                set: setScreenReaderCues,
                icon: Volume2,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <label key={idx} className="py-3.5 flex items-center justify-between cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.val}
                    onChange={(e) => item.set(e.target.checked)}
                    className="w-4 h-4 rounded accent-cyan-400 ml-4 shrink-0"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {savedFeedback ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Accessibility preferences applied!
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Settings save to your profile and apply across devices.</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Accessibility"}
          </button>
        </div>
      </div>
    </div>
  );
}
