"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, Key, Laptop, Lock, LogOut, ShieldAlert, ShieldCheck, Smartphone } from "lucide-react";
import { updateUserPassword } from "@/lib/profile/actions";
import { terminateOtherSessions } from "@/lib/settings/actions";

export default function SecuritySettings() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [twoFactorActive, setTwoFactorActive] = useState(true);

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }
    setIsUpdatingPassword(true);
    const res = await updateUserPassword(newPassword);
    setIsUpdatingPassword(false);
    setStatusMessage({ text: res.message, type: res.success ? "success" : "error" });
    if (res.success) {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleTerminateSessions = async () => {
    const res = await terminateOtherSessions();
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

      {/* Password Change */}
      <form onSubmit={handlePasswordChange} className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
        <h3 className="text-base font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-cyan-400" /> Change Account Password
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
              className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition"
          >
            <Lock className="w-4 h-4" />
            {isUpdatingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>

      {/* Two-Factor Authentication */}
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Two-Factor Authentication (2FA)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Add a second layer of defense requiring a verification code when signing in.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              twoFactorActive
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {twoFactorActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
            {twoFactorActive ? "Enabled" : "Disabled"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white">Authenticator Application</div>
            <div className="text-[11px] text-zinc-400">Google Authenticator, Authy, or 1Password.</div>
          </div>
          <button
            type="button"
            onClick={() => setTwoFactorActive(!twoFactorActive)}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition"
          >
            {twoFactorActive ? "Disable 2FA" : "Set Up 2FA"}
          </button>
        </div>
      </div>

      {/* Security Alerts Log */}
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" /> Security Event Telemetry
        </h3>

        <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden bg-zinc-900/30 text-xs">
          {[
            { event: "New browser login detected", ip: "192.168.1.104", date: "Today at 15:20" },
            { event: "Password changed successfully", ip: "192.168.1.104", date: "Yesterday at 11:45" },
            { event: "Two-factor authentication verified", ip: "192.168.1.104", date: "3 days ago" },
          ].map((sec, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">{sec.event}</div>
                <div className="text-[10px] text-zinc-400">IP: {sec.ip}</div>
              </div>
              <span className="text-[11px] text-zinc-500">{sec.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
