"use client";

import React, { useState } from "react";
import { Check, Clock, DollarSign, Globe, MapPin, Save } from "lucide-react";
import { UserSettings } from "@/types/settings";
import { saveUserSettingsPartial } from "@/lib/settings/actions";

interface LanguageSettingsProps {
  settings: UserSettings;
}

export default function LanguageSettings({ settings }: LanguageSettingsProps) {
  const [language, setLanguage] = useState(settings.language || "en");
  const [country, setCountry] = useState(settings.country || "US");
  const [timezone, setTimezone] = useState(settings.timezone || "UTC");
  const [dateFormat, setDateFormat] = useState(settings.date_format || "MMM D, YYYY");
  const [currency, setCurrency] = useState(settings.currency || "USD");

  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveUserSettingsPartial({
      language,
      country,
      timezone,
      date_format: dateFormat,
      currency,
    });
    setIsSaving(false);
    if (res.success) {
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" /> Language & Regional Localization
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Configure how dates, currencies, and UI content are formatted for your locale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Primary Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
            >
              <option value="en">English (US & International)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ja">日本語 (Japanese)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Country / Region</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
            >
              <option value="US">United States</option>
              <option value="IN">India</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="DE">Germany</option>
              <option value="JP">Japan</option>
              <option value="AU">Australia</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">Eastern Time (US & Canada)</option>
              <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
              <option value="Europe/London">London / GMT</option>
              <option value="Europe/Berlin">Central European Time</option>
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="Asia/Tokyo">Tokyo / JST</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Date Format</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
            >
              <option value="MMM D, YYYY">Oct 24, 2026</option>
              <option value="DD/MM/YYYY">24/10/2026</option>
              <option value="YYYY-MM-DD">2026-10-24</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Preferred Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
            >
              <option value="USD">USD ($) &bull; United States Dollar</option>
              <option value="INR">INR (₹) &bull; Indian Rupee</option>
              <option value="EUR">EUR (€) &bull; Euro</option>
              <option value="GBP">GBP (£) &bull; British Pound</option>
              <option value="JPY">JPY (¥) &bull; Japanese Yen</option>
            </select>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {savedFeedback ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Localization preferences saved!
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Dates and currencies will format according to these rules.</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Localization"}
          </button>
        </div>
      </div>
    </div>
  );
}
