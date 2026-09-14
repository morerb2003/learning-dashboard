"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Key, Laptop, LogOut, Mail, Phone, Save, ShieldAlert, Smartphone, User } from "lucide-react";
import { saveAccountInfo, changeEmailRequest, terminateOtherSessions } from "@/lib/settings/actions";

interface AccountSettingsProps {
  initialFullName: string;
  initialEmail: string;
  initialUsername?: string;
}

export default function AccountSettings({
  initialFullName,
  initialEmail,
  initialUsername,
}: AccountSettingsProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [username, setUsername] = useState(initialUsername || "");
  const [phone, setPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    const res = await saveAccountInfo({ fullName, username, phone });
    setIsSaving(false);
    setStatusMessage({ text: res.message, type: res.success ? "success" : "error" });
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === initialEmail) return;
    setIsChangingEmail(true);
    setStatusMessage(null);
    const res = await changeEmailRequest(newEmail);
    setIsChangingEmail(false);
    setStatusMessage({ text: res.message, type: res.success ? "success" : "error" });
    if (res.success) setNewEmail("");
  };

  const handleSignOutOthers = async () => {
    setIsLoggingOutOthers(true);
    setStatusMessage(null);
    const res = await terminateOtherSessions();
    setIsLoggingOutOthers(false);
    setStatusMessage({ text: res.message, type: res.success ? "success" : "error" });
  };

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-medium flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-bold uppercase hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Basic Account Identity */}
      <form onSubmit={handleSaveInfo} className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
        <h3 className="text-base font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" /> Personal Account Identity
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourusername"
                className="w-full h-11 pl-9 pr-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-white/5">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Change Email Address */}
      <form onSubmit={handleChangeEmail} className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-400" /> Primary Email Address
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Current email: <strong className="text-white">{initialEmail}</strong>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email address..."
            className="flex-1 h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-violet-400/50"
            required
          />
          <button
            type="submit"
            disabled={isChangingEmail || !newEmail || newEmail === initialEmail}
            className="px-5 h-11 rounded-2xl bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 text-xs font-bold disabled:opacity-50 transition"
          >
            {isChangingEmail ? "Sending..." : "Change Email"}
          </button>
        </div>
      </form>

      {/* Login Sessions & Device Management */}
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-400" /> Active Login Sessions
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Devices currently authorized to access your Learning Dashboard account.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOutOthers}
            disabled={isLoggingOutOthers}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            {isLoggingOutOthers ? "Logging out..." : "Sign Out Other Devices"}
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Current Device &bull; Web Browser</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active Now
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">Windows &bull; Chrome / Edge</div>
              </div>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">This session</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/20 border border-white/5 flex items-center justify-between opacity-80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Mobile Companion</div>
                <div className="text-[11px] text-zinc-400">iOS Mobile Safari &bull; Last active 2 days ago</div>
              </div>
            </div>
            <span className="text-[11px] text-zinc-500">Authorized</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-rose-500/20 bg-rose-500/5 space-y-4">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <ShieldAlert className="w-4 h-4" /> Delete or Deactivate Account
        </div>
        <p className="text-xs text-zinc-400">
          Deactivating temporarily freezes your enrollments. Deleting permanently destroys your certificates, progress, and submitted assignments.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => alert("Deactivation request initiated. Our support team will confirm via email.")}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 border border-white/10"
          >
            Deactivate Account
          </button>
          <button
            type="button"
            onClick={() => alert("Please contact support to permanently delete your account.")}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs font-bold text-rose-300 border border-rose-500/30"
          >
            Permanently Delete
          </button>
        </div>
      </div>
    </div>
  );
}
