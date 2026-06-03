"use client";

import React, { useState } from "react";
import { Shield, Settings, HardDrive, CreditCard, Save, Check, ShieldCheck } from "lucide-react";

export default function AdminSettingsPage() {
  const [userLimit, setUserLimit] = useState(500);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Platform Configuration</h2>
        <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Configure security policies, system limits, and billing tiers</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* General Settings */}
        <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
          <div className="absolute inset-0 bg-mesh-violet opacity-10 pointer-events-none" />
          <h3 className="text-sm font-bold text-white mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
            <Settings className="w-4 h-4 text-violet-400" /> General Platform settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Enable Open Registrations</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Allow new students to sign up using email or Google auth</p>
              </div>
              <button
                type="button"
                onClick={() => setAllowRegistration(!allowRegistration)}
                className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors cursor-pointer ${
                  allowRegistration ? "bg-violet-600 justify-end" : "bg-zinc-800 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>
        </section>

        {/* Security Posture */}
        <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
          <div className="absolute inset-0 bg-mesh-cyan opacity-10 pointer-events-none" />
          <h3 className="text-sm font-bold text-white mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" /> Security & Access Controls
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Enforce Multi-Factor Authentication (MFA)</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Require all Admin accounts to authenticate via 2FA</p>
              </div>
              <button
                type="button"
                onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors cursor-pointer ${
                  twoFactorAuth ? "bg-cyan-600 justify-end" : "bg-zinc-800 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-zinc-950/40 p-4 mt-2">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Row Level Security (RLS)</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                    Policies for profiles, notes, and courses are active. Database reads depend on JWT identity credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Limits */}
        <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
          <div className="absolute inset-0 bg-mesh-orange opacity-10 pointer-events-none" />
          <h3 className="text-sm font-bold text-white mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-orange-400" /> Platform Limits
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300">Student Capacity Limit</span>
                <span className="text-orange-400 font-bold">{userLimit} Users</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={userLimit}
                onChange={(e) => setUserLimit(parseInt(e.target.value))}
                className="w-full accent-orange-500 h-2 bg-white/5 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500">Max accounts that can concurrently register on the platform</p>
            </div>
          </div>
        </section>

        {/* Future Billing */}
        <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-sm font-bold text-white mb-4 border-b border-white/5 pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-zinc-400" /> SaaS Billing & Plan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                <h4 className="text-sm font-bold text-white mt-2">Enterprise Plan</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Unlimited storage, custom domains, and custom integrations</p>
              </div>
              <p className="text-lg font-black text-white mt-6">$299<span className="text-xs font-normal text-zinc-500">/mo</span></p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-between opacity-60">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">Available Upgrade</span>
                <h4 className="text-sm font-bold text-white mt-2">Infinite Plan</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Dedicated cloud hosting clusters, priority SLA, custom SSO integrations</p>
              </div>
              <p className="text-lg font-black text-white mt-6">$899<span className="text-xs font-normal text-zinc-500">/mo</span></p>
            </div>
          </div>
        </section>

        {/* Save Bar */}
        <div className="flex justify-end pt-4 border-t border-white/5">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-lg"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" /> Settings Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {isSaving ? "Saving Configuration..." : "Save Settings"}
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
