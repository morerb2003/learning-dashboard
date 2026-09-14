"use client";

import React, { useState } from "react";
import { Briefcase, Check, Clock, DollarSign, MessageSquare, Save, Users, Zap } from "lucide-react";
import { UserSettings } from "@/types/settings";
import { saveUserSettingsPartial } from "@/lib/settings/actions";

interface TeacherSettingsProps {
  settings: UserSettings;
}

export default function TeacherSettings({ settings }: TeacherSettingsProps) {
  const [teachingMode, setTeachingMode] = useState(settings.teaching_mode || "online");
  const [availableHours, setAvailableHours] = useState(settings.teaching_available_hours ?? 20);
  const [capacity, setCapacity] = useState(settings.student_capacity ?? 250);
  const [autoApprove, setAutoApprove] = useState(settings.auto_approve_enrollment ?? true);
  const [allowMessaging, setAllowMessaging] = useState(settings.allow_student_messaging ?? true);

  const [payoutMethod, setPayoutMethod] = useState(settings.preferred_payout_method || "bank_transfer");
  const [threshold, setThreshold] = useState(settings.payout_notification_threshold ?? 100.0);
  const [accountInfo, setAccountInfo] = useState(
    settings.payout_account_info || {
      account_name: "",
      account_number: "",
      bank_name: "",
      routing_or_ifsc: "",
      upi_id: "",
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveUserSettingsPartial({
      teaching_mode: teachingMode as any,
      teaching_available_hours: Number(availableHours),
      student_capacity: Number(capacity),
      auto_approve_enrollment: autoApprove,
      allow_student_messaging: allowMessaging,
      preferred_payout_method: payoutMethod as any,
      payout_notification_threshold: Number(threshold),
      payout_account_info: accountInfo,
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
            <Briefcase className="w-4 h-4 text-sky-400" /> Teaching Preferences & Capacity
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Configure how students interact with your courses and your availability for mentoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Teaching Delivery Mode</label>
            <select
              value={teachingMode}
              onChange={(e) => setTeachingMode(e.target.value as any)}
              className="w-full h-11 px-3 rounded-2xl bg-zinc-900/60 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-400/50"
            >
              <option value="online">Online Pre-Recorded & Live</option>
              <option value="hybrid">Hybrid Cohorts</option>
              <option value="offline">In-person Workshops</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Weekly Available Hours</label>
            <input
              type="number"
              value={availableHours}
              onChange={(e) => setAvailableHours(Number(e.target.value))}
              min={1}
              max={80}
              className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Student Capacity Limit</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              min={10}
              className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
            />
          </div>
        </div>

        {/* Enrollment & Communication Toggles */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <label className="flex items-center justify-between cursor-pointer py-2">
            <div>
              <div className="text-xs font-bold text-white">Auto-Approve Student Enrollments</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Grant students immediate course access without requiring manual instructor review.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="w-4 h-4 rounded accent-sky-400 ml-4 shrink-0"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer py-2 border-t border-white/5">
            <div>
              <div className="text-xs font-bold text-white">Allow Direct Student Messaging</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Students can send direct inquiries regarding assignments, quizzes, and project guidance.
              </div>
            </div>
            <input
              type="checkbox"
              checked={allowMessaging}
              onChange={(e) => setAllowMessaging(e.target.checked)}
              className="w-4 h-4 rounded accent-sky-400 ml-4 shrink-0"
            />
          </label>
        </div>

        {/* Payout Information */}
        <div className="pt-6 border-t border-white/5 space-y-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Instructor Payout Configuration
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Configure settlement preferences for your 85% course revenue share.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Settlement Method</label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value as any)}
                className="w-full h-11 px-3 rounded-2xl bg-zinc-900/60 border border-white/10 text-xs text-white focus:outline-none"
              >
                <option value="bank_transfer">Direct Bank Transfer (NEFT / Wire)</option>
                <option value="stripe">Stripe Express Connect</option>
                <option value="upi">UPI ID (Instant Transfer - India)</option>
                <option value="paypal">PayPal Business</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Notification Alert Threshold ($)</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                min={20}
                className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Beneficiary Name</label>
              <input
                type="text"
                value={accountInfo.account_name || ""}
                onChange={(e) => setAccountInfo({ ...accountInfo, account_name: e.target.value })}
                placeholder="Official Account Name"
                className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {payoutMethod === "upi" ? "UPI ID" : "Bank Account / IBAN Number"}
              </label>
              <input
                type="text"
                value={payoutMethod === "upi" ? accountInfo.upi_id || "" : accountInfo.account_number || ""}
                onChange={(e) =>
                  setAccountInfo(
                    payoutMethod === "upi"
                      ? { ...accountInfo, upi_id: e.target.value }
                      : { ...accountInfo, account_number: e.target.value }
                  )
                }
                placeholder={payoutMethod === "upi" ? "username@upi" : "00192837461928"}
                className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {savedFeedback ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Teaching preferences & payout info saved!
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Changes apply to all active and upcoming courses.</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-sky-400 text-zinc-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Teaching Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
