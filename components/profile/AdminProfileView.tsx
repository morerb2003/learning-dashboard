"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  HardDrive,
  Key,
  Layers,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Zap,
} from "lucide-react";
import ProfileLayout, { TabItem } from "./ProfileLayout";
import { FullProfileData, AdminPermissions } from "@/types/profile";
import {
  updateBaseProfile,
  updateAdminProfile,
  updateUserPassword,
} from "@/lib/profile/actions";

interface AdminProfileViewProps {
  data: FullProfileData;
}

const adminTabs: TabItem[] = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "personal", label: "Personal Info", icon: User },
  { id: "permissions", label: "Permissions Matrix", icon: ShieldCheck },
  { id: "security", label: "Security & Sessions", icon: Lock },
  { id: "activity", label: "Audit & Activity", icon: Activity },
  { id: "system", label: "System Health", icon: Server },
];

export default function AdminProfileView({ data }: AdminProfileViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Base profile state
  const [fullName, setFullName] = useState(data.base.full_name || "");
  const [username, setUsername] = useState(data.base.username || "");
  const [phone, setPhone] = useState(data.base.phone || "");
  const [bio, setBio] = useState(data.base.bio || "");
  const [location, setLocation] = useState(data.base.location || "");

  // Admin specific state
  const admin = data.admin;
  const [designation, setDesignation] = useState(admin?.designation || "Platform Administrator");
  const [department, setDepartment] = useState(admin?.department || "Operations & Security");
  const [recoveryEmail, setRecoveryEmail] = useState(admin?.recovery_email || "security-admin@aura.io");
  const [twoFactor, setTwoFactor] = useState(admin?.two_factor_enabled ?? true);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const permissions: AdminPermissions = admin?.permissions || {
    user_management: true,
    teacher_management: true,
    course_management: true,
    payments: true,
    subscriptions: true,
    reports: true,
    analytics: true,
    moderation: true,
    system_settings: true,
    audit_logs: true,
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const [resBase, resAdmin] = await Promise.all([
      updateBaseProfile({
        full_name: fullName,
        username,
        phone,
        bio,
        location,
      }),
      updateAdminProfile({
        designation,
        department,
        recovery_email: recoveryEmail,
        two_factor_enabled: twoFactor,
      }),
    ]);

    setIsSubmitting(false);
    setStatusMessage({
      text: resBase.success && resAdmin.success ? "Admin identity and credentials saved!" : (resBase.message || resAdmin.message),
      type: resBase.success && resAdmin.success ? "success" : "error",
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }
    setIsSubmitting(true);
    const res = await updateUserPassword(newPassword);
    setIsSubmitting(false);
    setStatusMessage({
      text: res.message,
      type: res.success ? "success" : "error",
    });
    if (res.success) {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // Header quick stats strip
  const headerStats = (
    <div className="flex items-center gap-3">
      <div className="px-4 py-2 rounded-2xl glass-card border border-rose-500/20 bg-rose-500/5 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-rose-400" />
        <div>
          <div className="text-[10px] uppercase font-bold text-rose-300">Role</div>
          <div className="text-sm font-black text-white">{admin?.admin_role || "SUPER_ADMIN"}</div>
        </div>
      </div>
      <div className="px-4 py-2 rounded-2xl glass-card border border-amber-500/20 bg-amber-500/5 flex items-center gap-2">
        <Lock className="w-4 h-4 text-amber-400" />
        <div>
          <div className="text-[10px] uppercase font-bold text-amber-300">Security</div>
          <div className="text-sm font-black text-white">{admin?.security_level || "Tier 3"}</div>
        </div>
      </div>
    </div>
  );

  return (
    <ProfileLayout
      baseProfile={data.base}
      tabs={adminTabs}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        setStatusMessage(null);
      }}
      headerStats={headerStats}
    >
      {/* Status Banner */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl border text-sm font-medium flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs uppercase font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Admin Identity Card */}
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-zinc-900/50 to-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-rose-300 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                Administrative Authority &bull; {admin?.admin_role || "SUPER_ADMIN"}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white">{designation}</h2>
              <p className="text-xs md:text-sm text-zinc-300">
                Department: <span className="text-white font-semibold">{department}</span> &bull; Platform clearance level: <span className="text-rose-300 font-bold">{admin?.security_level || "Tier 3"}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/users"
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10"
              >
                User Registry
              </Link>
              <Link
                href="/admin/moderation"
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10"
              >
                Moderation Queue
              </Link>
              <Link
                href="/admin/settings"
                className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs font-bold text-rose-300 border border-rose-500/30"
              >
                System Settings
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Access Scope</span>
              <div className="text-xl font-black text-white">Full Platform</div>
              <p className="text-[10px] text-zinc-400">10 of 10 subsystems active</p>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Two-Factor (2FA)</span>
              <div className="text-xl font-black text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Enabled
              </div>
              <p className="text-[10px] text-zinc-400">Hardware & Authenticator</p>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Last Login IP</span>
              <div className="text-xl font-black text-sky-400 font-mono text-sm mt-1">{admin?.last_login_ip || "192.168.1.104"}</div>
              <p className="text-[10px] text-zinc-400">Verified trusted device</p>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Account Status</span>
              <div className="text-xl font-black text-emerald-400">Normal / Good</div>
              <p className="text-[10px] text-zinc-400">Zero policy violations</p>
            </div>
          </div>

          {/* Recent Audit Snippet */}
          <div className="p-6 rounded-3xl glass-card border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-400" /> Recent Administrative Activity
              </h3>
              <Link href="/admin/activity" className="text-xs font-bold text-rose-300 hover:underline">
                Full Audit Vault &rarr;
              </Link>
            </div>

            <div className="space-y-2">
              {data.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
                data.recentAuditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-400 uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-white/5">
                        {log.action}
                      </span>
                      <span className="text-zinc-200">{log.entity_type}</span>
                    </div>
                    <span className="text-zinc-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 py-3 text-center">No recent audit logs recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL INFO */}
      {activeTab === "personal" && (
        <form onSubmit={handleSavePersonalInfo} className="space-y-6 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-rose-400" /> Admin Official Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-rose-400/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Admin Handle</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin_alias"
                    className="w-full h-11 pl-9 pr-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-rose-400/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Designation / Title</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Platform Administrator"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-rose-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Engineering / Security"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-rose-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Official Email</label>
                <input
                  type="email"
                  value={data.base.email || ""}
                  disabled
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/30 border border-white/5 text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Emergency Recovery Email</label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="backup-security@company.com"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-rose-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Office Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2831"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-rose-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Duty Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Headquarters (Seattle, WA)"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-rose-400/50"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Role Statement</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Overseeing system reliability, compliance, teacher verification, and security posture..."
                  className="w-full p-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-rose-400/50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-400 text-zinc-950 font-black text-sm shadow-xl shadow-rose-500/10 hover:brightness-110 disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Saving..." : "Save Admin Profile"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: PERMISSIONS MATRIX */}
      {activeTab === "permissions" && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Administrative Permissions & Privilege Matrix
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Active security policies governing this account. Inherited from role: <span className="font-bold text-rose-300">{admin?.admin_role || "SUPER_ADMIN"}</span>
              </p>
            </div>

            <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden bg-zinc-900/30">
              {[
                { name: "User Management", desc: "View, edit, suspend, and delete student accounts", granted: permissions.user_management },
                { name: "Teacher Management", desc: "Approve teacher applications, review credentials, manage payouts", granted: permissions.teacher_management },
                { name: "Course Management", desc: "Publish, unpublish, inspect lessons, edit course categories", granted: permissions.course_management },
                { name: "Payment Operations", desc: "Access gateway logs, inspect transactions, issue refunds", granted: permissions.payments },
                { name: "Subscriptions & Plans", desc: "Configure pricing tiers, manage coupons, renew billing", granted: permissions.subscriptions },
                { name: "Analytics & Revenue", desc: "Export financial statements, track growth and churn metrics", granted: permissions.analytics },
                { name: "Content Moderation", desc: "Review reported discussions, forum posts, and student reviews", granted: permissions.moderation },
                { name: "System Settings", desc: "Modify platform configuration, email templates, security rules", granted: permissions.system_settings },
                { name: "Audit Vault & Logs", desc: "Access immutable security records and event telemetry", granted: permissions.audit_logs },
              ].map((perm) => (
                <div key={perm.name} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{perm.name}</div>
                    <div className="text-xs text-zinc-400">{perm.desc}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    perm.granted
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                      : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {perm.granted ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                    {perm.granted ? "Granted" : "Restricted"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & SESSIONS */}
      {activeTab === "security" && (
        <div className="space-y-6 max-w-4xl">
          {/* 2FA Toggle & Settings */}
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Platform Security & MFA
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</div>
                <div className="text-xs text-zinc-400">Mandatory for all Platform Administrators.</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                Active &bull; Authenticator App
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white">Emergency Recovery Email</div>
                <div className="text-xs text-zinc-400">{recoveryEmail || "Not specified"}</div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("personal")}
                className="text-xs text-amber-300 hover:underline font-bold"
              >
                Change
              </button>
            </div>
          </div>

          {/* Change Password */}
          <form onSubmit={handlePasswordChange} className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" /> Change Administrator Password
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-rose-400/50"
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
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-rose-400/50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
              >
                <Key className="w-4 h-4" /> Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: AUDIT & ACTIVITY */}
      {activeTab === "activity" && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400" /> Activity Log & Audit Trail
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Immutable security log of administrative actions.</p>
              </div>
              <Link
                href="/admin/activity"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10"
              >
                Open Full Log Viewer
              </Link>
            </div>

            <div className="space-y-2.5">
              {data.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
                data.recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-rose-300 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 mr-2">
                        {log.action}
                      </span>
                      <span className="text-xs font-medium text-white">{log.entity_type}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 py-6 text-center">No recent audit logs available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM HEALTH */}
      {activeTab === "system" && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" /> Platform System Telemetry
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Infrastructure, database connectivity, and environment status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Supabase DB Engine</span>
                  <span className="text-xs font-bold text-emerald-400">Operational</span>
                </div>
                <div className="text-[11px] text-zinc-500">PostgreSQL 15 &bull; Row Level Security Enabled</div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Next.js Edge Proxy</span>
                  <span className="text-xs font-bold text-emerald-400">Healthy</span>
                </div>
                <div className="text-[11px] text-zinc-500">Session refresh & RBAC routing active</div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Google OAuth Gateway</span>
                  <span className="text-xs font-bold text-emerald-400">Configured</span>
                </div>
                <div className="text-[11px] text-zinc-500">Redirect URI & Token exchange active</div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Payments & Subscriptions</span>
                  <span className="text-xs font-bold text-emerald-400">Active</span>
                </div>
                <div className="text-[11px] text-zinc-500">Stripe / mock intent handler ready</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  );
}
