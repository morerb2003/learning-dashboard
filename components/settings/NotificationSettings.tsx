"use client";

import React, { useState } from "react";
import { Bell, Check, Clock, Mail, MessageSquare, Save, ShieldAlert, Sparkles } from "lucide-react";
import { UserSettings, NotificationFrequency } from "@/types/settings";
import { saveUserSettingsPartial } from "@/lib/settings/actions";

interface NotificationSettingsProps {
  settings: UserSettings;
}

export default function NotificationSettings({ settings }: NotificationSettingsProps) {
  const [emailNotifs, setEmailNotifs] = useState(settings.email_notifications ?? true);
  const [inAppNotifs, setInAppNotifs] = useState(settings.in_app_notifications ?? true);
  const [courseUpdates, setCourseUpdates] = useState(settings.course_updates ?? true);
  const [quizReminders, setQuizReminders] = useState(settings.quiz_reminders ?? true);
  const [certAlerts, setCertAlerts] = useState(settings.certificate_alerts ?? true);
  const [newCourses, setNewCourses] = useState(settings.new_course_alerts ?? true);
  const [paymentAlerts, setPaymentAlerts] = useState(settings.payment_alerts ?? true);
  const [messagesAlerts, setMessagesAlerts] = useState(settings.messages_alerts ?? true);
  const [announcements, setAnnouncements] = useState(settings.announcements_alerts ?? true);
  const [frequency, setFrequency] = useState<NotificationFrequency>(settings.notification_frequency || "instant");

  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveUserSettingsPartial({
      email_notifications: emailNotifs,
      in_app_notifications: inAppNotifs,
      course_updates: courseUpdates,
      quiz_reminders: quizReminders,
      certificate_alerts: certAlerts,
      new_course_alerts: newCourses,
      payment_alerts: paymentAlerts,
      messages_alerts: messagesAlerts,
      announcements_alerts: announcements,
      notification_frequency: frequency,
    });
    setIsSaving(false);
    if (res.success) {
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    }
  };

  const toggles = [
    {
      title: "Course Updates & Content Additions",
      desc: "Receive alerts when lessons, videos, or quizzes are updated in enrolled courses.",
      state: courseUpdates,
      setter: setCourseUpdates,
    },
    {
      title: "Assignment & Quiz Reminders",
      desc: "Upcoming due date and submission deadline notifications.",
      state: quizReminders,
      setter: setQuizReminders,
    },
    {
      title: "Certificate & Achievement Awards",
      desc: "Instant notice when course completion badges or certificates are issued.",
      state: certAlerts,
      setter: setCertAlerts,
    },
    {
      title: "New Course Announcements",
      desc: "Recommendations when instructors launch courses in your skill areas.",
      state: newCourses,
      setter: setNewCourses,
    },
    {
      title: "Billing & Subscription Notices",
      desc: "Receipts, invoice renewals, and payment method expirations.",
      state: paymentAlerts,
      setter: setPaymentAlerts,
    },
    {
      title: "Teacher & Student Messages",
      desc: "Direct messages and discussion replies from peers and course mentors.",
      state: messagesAlerts,
      setter: setMessagesAlerts,
    },
    {
      title: "Platform Announcements",
      desc: "Scheduled maintenance alerts, system updates, and platform release notes.",
      state: announcements,
      setter: setAnnouncements,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-8">
        {/* Master Channels */}
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" /> Delivery Channels
          </h3>
          <p className="text-xs text-zinc-400 mt-1">Choose where you prefer to be notified.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <label className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/10 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-400/10 text-cyan-300 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Email Delivery</div>
                  <div className="text-[10px] text-zinc-400">Delivered directly to primary inbox</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 rounded accent-cyan-400"
              />
            </label>

            <label className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/10 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-400/10 text-violet-300 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">In-App Alerts</div>
                  <div className="text-[10px] text-zinc-400">Bell badge and realtime notifications</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={inAppNotifs}
                onChange={(e) => setInAppNotifs(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-400"
              />
            </label>
          </div>
        </div>

        {/* Frequency */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-white">Notification Frequency</div>
            <div className="text-xs text-zinc-400">Batch notifications to minimize inbox interruptions.</div>
          </div>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            className="h-10 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="instant">Instant (As events happen)</option>
            <option value="daily">Daily Digest (Once per day)</option>
            <option value="weekly">Weekly Summary (Mondays)</option>
          </select>
        </div>

        {/* Event Toggles */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" /> Event Subscriptions
          </h3>

          <div className="divide-y divide-white/5">
            {toggles.map((t, idx) => (
              <label key={idx} className="py-3.5 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">{t.title}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{t.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={t.state}
                  onChange={(e) => t.setter(e.target.checked)}
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
              <Check className="w-4 h-4" /> Notification settings saved!
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Changes apply immediately to upcoming alerts.</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Notifications"}
          </button>
        </div>
      </div>
    </div>
  );
}
