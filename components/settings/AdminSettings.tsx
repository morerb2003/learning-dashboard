"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, ExternalLink, HardDrive, Lock, Save, Server, Shield, ShieldCheck, Zap } from "lucide-react";
import { UserSettings } from "@/types/settings";
import { saveUserSettingsPartial } from "@/lib/settings/actions";

interface AdminSettingsProps {
  settings: UserSettings;
}

export default function AdminSettings({ settings }: AdminSettingsProps) {
  const [maintenanceNotifications, setMaintenanceNotifications] = useState(
    settings.maintenance_notifications ?? true
  );
  const [auditLevel, setAuditLevel] = useState(settings.audit_logging_level || "detailed");

  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await saveUserSettingsPartial({
      maintenance_notifications: maintenanceNotifications,
      audit_logging_level: auditLevel as any,
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
            <Server className="w-4 h-4 text-rose-400" /> Platform Administration & Operations
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Global administrative preferences, security alert dispatching, and system configurations.
          </p>
        </div>

        {/* Global Deep Settings Link */}
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" /> Global Platform System Console
            </div>
            <p className="text-xs text-zinc-300">
              Configure database connections, SMTP email servers, Stripe payment gateways, and storage buckets.
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition shrink-0"
          >
            Launch System Console <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Audit Logging & Monitoring Preferences */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white">Security Audit Log Verbosity</div>
              <div className="text-xs text-zinc-400">Controls granularity of actor records stored in the audit log table.</div>
            </div>
            <select
              value={auditLevel}
              onChange={(e) => setAuditLevel(e.target.value as any)}
              className="h-10 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
            >
              <option value="standard">Standard (Actions & Outcomes)</option>
              <option value="detailed">Detailed (Payloads & IPs)</option>
              <option value="verbose">Verbose (Raw Headers & Telemetry)</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              <div className="text-sm font-bold text-white">System Maintenance Alerts</div>
              <div className="text-xs text-zinc-400">Receive priority broadcast notifications prior to scheduled maintenance windows.</div>
            </div>
            <input
              type="checkbox"
              checked={maintenanceNotifications}
              onChange={(e) => setMaintenanceNotifications(e.target.checked)}
              className="w-4 h-4 rounded accent-rose-400"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {savedFeedback ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Admin preferences saved!
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Applies to your administrative session and monitoring alerts.</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-400 text-zinc-950 font-black text-xs hover:brightness-110 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Admin Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
