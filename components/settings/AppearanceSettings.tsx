"use client";

import React, { useState } from "react";
import { Check, Laptop, Moon, Palette, Save, Sliders, Sun } from "lucide-react";
import { UserSettings, ThemeMode, AccentColor, LayoutDensity, FontSizeOption } from "@/types/settings";
import { saveUserSettingsPartial } from "@/lib/settings/actions";

interface AppearanceSettingsProps {
  settings: UserSettings;
}

export default function AppearanceSettings({ settings }: AppearanceSettingsProps) {
  const [theme, setTheme] = useState<ThemeMode>(settings.theme || "dark");
  const [accent, setAccent] = useState<AccentColor>(settings.accent_color || "violet");
  const [density, setDensity] = useState<LayoutDensity>(settings.layout_density || "comfortable");
  const [reduceAnimations, setReduceAnimations] = useState(settings.reduce_animations ?? false);
  const [fontSize, setFontSize] = useState<FontSizeOption>(settings.font_size || "normal");

  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveUserSettingsPartial({
      theme,
      accent_color: accent,
      layout_density: density,
      reduce_animations: reduceAnimations,
      font_size: fontSize,
    });
    setIsSaving(false);
    if (res.success) {
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    }
  };

  const accentColors: Array<{ id: AccentColor; name: string; bg: string }> = [
    { id: "violet", name: "Violet Glow", bg: "bg-violet-500" },
    { id: "cyan", name: "Cyber Cyan", bg: "bg-cyan-400" },
    { id: "sky", name: "Sky Blue", bg: "bg-sky-400" },
    { id: "emerald", name: "Emerald Mint", bg: "bg-emerald-400" },
    { id: "rose", name: "Neon Rose", bg: "bg-rose-500" },
    { id: "amber", name: "Solar Amber", bg: "bg-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-8">
        {/* Theme Mode */}
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Moon className="w-4 h-4 text-cyan-400" /> Interface Color Theme
          </h3>
          <p className="text-xs text-zinc-400 mt-1">Select your preferred lighting ambiance.</p>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { id: "dark" as ThemeMode, label: "Dark Mode", icon: Moon, desc: "Default dark OLED aesthetic" },
              { id: "light" as ThemeMode, label: "Light Mode", icon: Sun, desc: "Clean bright contrast" },
              { id: "system" as ThemeMode, label: "System Sync", icon: Laptop, desc: "Matches operating system" },
            ].map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-cyan-400/60 bg-cyan-400/10 shadow-lg shadow-cyan-500/10"
                      : "border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-white/10"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-cyan-300" : "text-zinc-500"}`} />
                  <div className="text-xs font-bold text-white mt-2">{option.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{option.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color */}
        <div className="pt-6 border-t border-white/5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-violet-400" /> Brand Accent Color
          </h3>
          <p className="text-xs text-zinc-400 mt-1">Personalize button glows, active tabs, and badges.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4">
            {accentColors.map((c) => {
              const isSelected = accent === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAccent(c.id)}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? "border-white/30 bg-white/10 shadow-md"
                      : "border-white/5 bg-zinc-900/30 hover:border-white/10"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${c.bg} flex items-center justify-center`}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-zinc-950 font-black" />}
                  </div>
                  <span className="text-xs font-bold text-zinc-200">{c.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Density & Animation */}
        <div className="pt-6 border-t border-white/5 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" /> Layout & Motion
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white">Layout Density</div>
              <div className="text-xs text-zinc-400">Comfortable padding or compact information-dense spacing.</div>
            </div>
            <div className="flex rounded-xl bg-zinc-900 p-1 border border-white/5">
              <button
                type="button"
                onClick={() => setDensity("comfortable")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  density === "comfortable" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => setDensity("compact")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  density === "compact" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Compact
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              <div className="text-sm font-bold text-white">Reduce Motion & Micro-Animations</div>
              <div className="text-xs text-zinc-400">Diminishes mesh glow pulses and slide-in animations.</div>
            </div>
            <input
              type="checkbox"
              checked={reduceAnimations}
              onChange={(e) => setReduceAnimations(e.target.checked)}
              className="w-4 h-4 rounded accent-cyan-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
            <div>
              <div className="text-sm font-bold text-white">Typography Scale</div>
              <div className="text-xs text-zinc-400">Adjust text size across dashboards and lesson pages.</div>
            </div>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value as any)}
              className="h-10 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
            >
              <option value="small">Small (Compact UI)</option>
              <option value="normal">Normal (Default)</option>
              <option value="large">Large (Enhanced Readability)</option>
            </select>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {savedFeedback ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Appearance preferences saved!
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Preferences persist across all sessions.</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Appearance"}
          </button>
        </div>
      </div>
    </div>
  );
}
