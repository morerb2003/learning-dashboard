"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  HardDrive,
  CreditCard,
  Bell,
  AlertTriangle,
  Save,
  Check,
  ShieldCheck,
  Globe,
  Lock,
  RefreshCw,
  Database,
  Zap,
  Mail,
  BellRing,
  BookOpen,
  Users,
  Trash2,
  Download,
  ChevronRight,
  Info,
  BarChart3,
  Server,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

/* ─────────────── Reusable primitives ─────────────── */

function Toggle({
  value,
  onChange,
  color = "violet",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  color?: "violet" | "cyan" | "emerald" | "amber";
}) {
  const colors: Record<string, string> = {
    violet: "bg-violet-600",
    cyan: "bg-cyan-600",
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full p-0.5 flex items-center transition-all duration-300 cursor-pointer shrink-0 ${
        value ? colors[color] : "bg-zinc-800"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
  danger = false,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-white/[0.04] last:border-0">
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${danger ? "text-rose-300" : "text-white"}`}>
          {label}
        </p>
        {description && (
          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  iconColor = "text-violet-400",
  mesh = "bg-mesh-violet",
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  mesh?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02] p-6">
      <div className={`absolute inset-0 ${mesh} opacity-10 pointer-events-none`} />
      <div className="grain-overlay" />
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/[0.06]">
          <div className={`p-1.5 rounded-lg bg-white/5 border border-white/5`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        {children}
      </div>
    </section>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
        ok
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border-rose-500/20 bg-rose-500/10 text-rose-300"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`} />
      {label}
    </span>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-zinc-950/50 border border-white/[0.07] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-zinc-600">{hint}</p>}
    </div>
  );
}

/* ─────────────── Tab definitions ─────────────── */

const TABS = [
  { id: "general",       label: "General",           icon: Settings },
  { id: "security",      label: "Security",           icon: Shield },
  { id: "limits",        label: "Platform Limits",    icon: HardDrive },
  { id: "notifications", label: "Notifications",      icon: Bell },
  { id: "billing",       label: "Billing & Plan",     icon: CreditCard },
  { id: "danger",        label: "Danger Zone",        icon: AlertTriangle },
] as const;

type TabId = typeof TABS[number]["id"];

/* ─────────────── Main page component ─────────────── */

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  /* General */
  const [platformName, setPlatformName] = useState("AURA LMS");
  const [platformTagline, setPlatformTagline] = useState("Modern Learning for the Next Generation");
  const [supportEmail, setSupportEmail] = useState("support@auralms.io");
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showCommunity, setShowCommunity] = useState(true);

  /* Security */
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("720");
  const [passwordPolicy, setPasswordPolicy] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState(false);

  /* Limits */
  const [userLimit, setUserLimit] = useState(500);
  const [storagePerUser, setStoragePerUser] = useState(2);
  const [maxCourseSize, setMaxCourseSize] = useState(5);
  const [maxLessonsPerCourse, setMaxLessonsPerCourse] = useState(50);

  /* Notifications */
  const [emailNewEnrollment, setEmailNewEnrollment] = useState(true);
  const [emailReportFlag, setEmailReportFlag] = useState(true);
  const [emailTeacherRequest, setEmailTeacherRequest] = useState(true);
  const [emailPayment, setEmailPayment] = useState(true);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(false);
  const [smtpHost, setSmtpHost] = useState("smtp.resend.com");
  const [smtpPort, setSmtpPort] = useState("465");
  const [smtpApiKey, setSmtpApiKey] = useState("re_●●●●●●●●●●●●●●●●");

  /* Danger */
  const [dangerConfirm, setDangerConfirm] = useState("");
  const [dangerAction, setDangerAction] = useState<string | null>(null);

  /* Save state */
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }, 1000);
  };

  const systemStatus = [
    { label: "Database", ok: true },
    { label: "Auth", ok: true },
    { label: "Storage", ok: true },
    { label: "Realtime", ok: true },
    { label: "Maintenance", ok: !maintenanceMode },
  ];

  /* ── Tab panels ── */

  const renderGeneral = () => (
    <div className="space-y-6">
      <SectionCard title="Platform Identity" icon={Globe} iconColor="text-violet-400" mesh="bg-mesh-violet">
        <div className="space-y-4">
          <InputField
            label="Platform Name"
            value={platformName}
            onChange={setPlatformName}
            placeholder="AURA LMS"
            hint="Shown in the browser tab, emails, and across the platform"
          />
          <InputField
            label="Tagline"
            value={platformTagline}
            onChange={setPlatformTagline}
            placeholder="Modern Learning for the Next Generation"
          />
          <InputField
            label="Support Email"
            value={supportEmail}
            onChange={setSupportEmail}
            type="email"
            placeholder="support@yourdomain.com"
            hint="All system emails (billing, alerts) come from or CC this address"
          />
        </div>
      </SectionCard>

      <SectionCard title="Access & Visibility" icon={Lock} iconColor="text-cyan-400" mesh="bg-mesh-cyan">
        <SettingRow
          label="Open Registrations"
          description="Allow new students to create accounts via email or Google OAuth"
        >
          <Toggle value={allowRegistration} onChange={setAllowRegistration} color="violet" />
        </SettingRow>

        <SettingRow
          label="Community Hub"
          description="Show the /community page and Discussion features to enrolled students"
        >
          <Toggle value={showCommunity} onChange={setShowCommunity} color="cyan" />
        </SettingRow>

        <SettingRow
          label="Maintenance Mode"
          description="Show a maintenance banner and block all non-admin access to the platform"
          danger={maintenanceMode}
        >
          <Toggle value={maintenanceMode} onChange={setMaintenanceMode} color="amber" />
        </SettingRow>
      </SectionCard>

      {/* System Status */}
      <SectionCard title="System Status" icon={Server} iconColor="text-emerald-400" mesh="bg-mesh-emerald">
        <div className="flex flex-wrap gap-3">
          {systemStatus.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              <StatusPill ok={s.ok} label={s.ok ? "Online" : "Down"} />
              <p className="text-[10px] text-zinc-500 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-zinc-600">Last checked: {new Date().toLocaleTimeString()}</p>
      </SectionCard>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <SectionCard title="Authentication Policies" icon={Shield} iconColor="text-cyan-400" mesh="bg-mesh-cyan">
        <SettingRow
          label="Enforce Multi-Factor Authentication"
          description="All admin accounts must complete 2FA before accessing restricted routes"
        >
          <Toggle value={twoFactorAuth} onChange={setTwoFactorAuth} color="cyan" />
        </SettingRow>

        <SettingRow
          label="Strong Password Policy"
          description="Require min. 10 chars, uppercase, number, and special character on all accounts"
        >
          <Toggle value={passwordPolicy} onChange={setPasswordPolicy} color="violet" />
        </SettingRow>

        <SettingRow label="Session Timeout" description="Automatically log out idle admin sessions">
          <select
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            className="bg-zinc-950/50 border border-white/[0.07] rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none focus:border-violet-500/50 cursor-pointer"
          >
            <option value="60">1 hour</option>
            <option value="180">3 hours</option>
            <option value="720">12 hours</option>
            <option value="1440">24 hours</option>
            <option value="0">Never</option>
          </select>
        </SettingRow>
      </SectionCard>

      <SectionCard title="Audit & Monitoring" icon={BarChart3} iconColor="text-violet-400" mesh="bg-mesh-violet">
        <SettingRow
          label="Immutable Audit Logging"
          description="Record all admin actions, content mutations, and login events to the audit_logs table"
        >
          <Toggle value={auditLogging} onChange={setAuditLogging} color="violet" />
        </SettingRow>

        <SettingRow
          label="IP Address Allowlisting"
          description="Restrict admin panel access to specific IP addresses (requires list configuration)"
        >
          <Toggle value={ipWhitelist} onChange={setIpWhitelist} color="amber" />
        </SettingRow>
      </SectionCard>

      {/* RLS Status */}
      <SectionCard title="Row Level Security (RLS)" icon={ShieldCheck} iconColor="text-emerald-400" mesh="bg-mesh-emerald">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {["profiles", "courses", "notes", "enrollments", "moderation_flags", "audit_logs", "notifications", "direct_messages"].map((table) => (
            <div
              key={table}
              className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-zinc-950/30 px-3.5 py-2.5"
            >
              <span className="text-[11px] font-mono text-zinc-400">{table}</span>
              <StatusPill ok label="Active" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-violet-500/10 bg-violet-500/[0.03] p-3.5">
          <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            RLS policies are enforced at the database level via Supabase. All reads and writes are scoped to the authenticated user's JWT identity. Admin bypass is provided via <code className="font-mono text-violet-300 bg-violet-500/10 px-1 rounded">is_admin()</code> role check.
          </p>
        </div>
      </SectionCard>
    </div>
  );

  const renderLimits = () => (
    <div className="space-y-6">
      <SectionCard title="User Capacity" icon={Users} iconColor="text-orange-400" mesh="bg-mesh-orange">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-300">Maximum Registered Students</span>
              <span className="text-orange-400 font-black tabular-nums">{userLimit.toLocaleString()} users</span>
            </div>
            <input
              type="range"
              min="10"
              max="10000"
              step="10"
              value={userLimit}
              onChange={(e) => setUserLimit(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500 bg-white/5"
            />
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>10</span>
              <span>10,000</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-300">Storage Per User</span>
              <span className="text-orange-400 font-black">{storagePerUser} GB</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={storagePerUser}
              onChange={(e) => setStoragePerUser(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500 bg-white/5"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Content Limits" icon={BookOpen} iconColor="text-violet-400" mesh="bg-mesh-violet">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-300">Max Course Package Size</span>
              <span className="text-violet-400 font-black">{maxCourseSize} GB</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={maxCourseSize}
              onChange={(e) => setMaxCourseSize(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-violet-500 bg-white/5"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-300">Max Lessons Per Course</span>
              <span className="text-violet-400 font-black">{maxLessonsPerCourse} lessons</span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={maxLessonsPerCourse}
              onChange={(e) => setMaxLessonsPerCourse(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-violet-500 bg-white/5"
            />
          </div>
        </div>
      </SectionCard>

      {/* Usage summary card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Capacity Limit", value: userLimit.toLocaleString(), unit: "users", color: "text-orange-400" },
          { label: "Storage/User", value: storagePerUser, unit: "GB", color: "text-violet-400" },
          { label: "Course Size", value: maxCourseSize, unit: "GB max", color: "text-cyan-400" },
          { label: "Lessons/Course", value: maxLessonsPerCourse, unit: "max", color: "text-emerald-400" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{item.label}</p>
            <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-zinc-600">{item.unit}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <SectionCard title="SMTP Configuration" icon={Mail} iconColor="text-cyan-400" mesh="bg-mesh-cyan">
        <div className="grid sm:grid-cols-2 gap-4">
          <InputField label="SMTP Host" value={smtpHost} onChange={setSmtpHost} placeholder="smtp.resend.com" />
          <InputField label="SMTP Port" value={smtpPort} onChange={setSmtpPort} placeholder="465" />
        </div>
        <div className="mt-4">
          <InputField
            label="API Key / Password"
            value={smtpApiKey}
            onChange={setSmtpApiKey}
            type="password"
            hint="Stored encrypted. Used for outbound email delivery."
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 rounded-xl text-xs font-bold text-cyan-300 cursor-pointer transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Send Test Email
          </button>
          <span className="text-[10px] text-zinc-500">Sends a test message to your support inbox</span>
        </div>
      </SectionCard>

      <SectionCard title="Email Notification Triggers" icon={BellRing} iconColor="text-violet-400" mesh="bg-mesh-violet">
        <SettingRow
          label="New Student Enrollment"
          description="Email admins when a student enrolls in a course"
        >
          <Toggle value={emailNewEnrollment} onChange={setEmailNewEnrollment} color="violet" />
        </SettingRow>

        <SettingRow
          label="Content Moderation Flag"
          description="Alert admins when content is reported via the moderation queue"
        >
          <Toggle value={emailReportFlag} onChange={setEmailReportFlag} color="violet" />
        </SettingRow>

        <SettingRow
          label="Teacher Application"
          description="Notify when a user requests the teacher role (pending_teacher)"
        >
          <Toggle value={emailTeacherRequest} onChange={setEmailTeacherRequest} color="violet" />
        </SettingRow>

        <SettingRow
          label="Payment Confirmation"
          description="Send receipt emails on successful course or subscription payments"
        >
          <Toggle value={emailPayment} onChange={setEmailPayment} color="emerald" />
        </SettingRow>

        <SettingRow
          label="Weekly Analytics Digest"
          description="Summary of enrollments, revenue, and platform activity every Monday"
        >
          <Toggle value={emailWeeklyDigest} onChange={setEmailWeeklyDigest} color="cyan" />
        </SettingRow>
      </SectionCard>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-violet-500/[0.04] p-6">
        <div className="absolute inset-0 bg-mesh-violet opacity-20 pointer-events-none" />
        <div className="grain-overlay" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/15 text-violet-300">
              ✦ Currently Active
            </span>
            <h3 className="text-2xl font-black text-white">Enterprise Plan</h3>
            <p className="text-sm text-zinc-400">Unlimited storage · Custom domains · Priority support · Custom SSO</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Unlimited Students", "Custom Domain", "API Access", "Audit Logs", "Priority SLA", "Dedicated CSM"].map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/15 px-2.5 py-1 rounded-full">
                  <Check className="w-3 h-3" />
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-4xl font-black text-white">$299</p>
            <p className="text-xs text-zinc-500 mt-1">per month, billed annually</p>
            <p className="text-[10px] text-emerald-400 mt-1 font-semibold">Next renewal: Aug 1, 2026</p>
          </div>
        </div>
      </div>

      {/* Upgrade option */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Other Available Plans</p>
          <h4 className="text-lg font-black text-white">Infinity Plan</h4>
          <p className="text-[11px] text-zinc-500 mt-1">Dedicated cloud cluster · Priority SLA · Custom SSO integrations · Multi-region</p>
          <p className="text-2xl font-black text-white mt-4">$899<span className="text-xs font-normal text-zinc-500">/mo</span></p>
          <button
            type="button"
            className="mt-4 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 cursor-pointer transition-colors"
          >
            Contact Sales →
          </button>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 space-y-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Payment Method on File</p>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-zinc-950/30 p-3.5">
            <div className="w-10 h-6 rounded bg-gradient-to-r from-violet-600 to-blue-600 flex items-center justify-center text-[8px] font-black text-white">VISA</div>
            <div>
              <p className="text-xs font-bold text-white">•••• •••• •••• 4292</p>
              <p className="text-[10px] text-zinc-500">Expires 08/2027</p>
            </div>
          </div>
          <button
            type="button"
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 cursor-pointer transition-colors"
          >
            Update Payment Method
          </button>

          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Last Invoice</span>
              <span className="text-white font-semibold">$299 · Jun 1, 2026</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-400 hover:text-violet-300 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Download Invoice PDF
            </button>
          </div>
        </div>
      </div>

      {/* Usage metrics */}
      <SectionCard title="Current Usage" icon={Database} iconColor="text-orange-400" mesh="bg-mesh-orange">
        <div className="space-y-4">
          {[
            { label: "Active Students", used: 342, limit: userLimit, color: "bg-violet-500" },
            { label: "Storage Used", used: 18, limit: 100, unit: "GB", color: "bg-cyan-500" },
            { label: "Bandwidth This Month", used: 340, limit: 1000, unit: "GB", color: "bg-orange-500" },
          ].map((metric) => {
            const pct = Math.round((metric.used / metric.limit) * 100);
            return (
              <div key={metric.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">{metric.label}</span>
                  <span className="text-zinc-300">
                    {metric.used}{metric.unit ? ` ${metric.unit}` : ""} / {metric.limit}{metric.unit ? ` ${metric.unit}` : ""}
                    <span className="ml-2 text-zinc-500">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${metric.color} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );

  const renderDanger = () => {
    const isDangerConfirmed = dangerConfirm.trim().toUpperCase() === "CONFIRM";

    const actions = [
      {
        id: "export",
        icon: Download,
        title: "Export All Platform Data",
        description: "Download a full JSON/CSV export of all users, enrollments, courses, and transactions. This may take several minutes.",
        buttonLabel: "Export Data",
        buttonClass: "bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/20 text-blue-300",
        requiresConfirm: false,
      },
      {
        id: "purge-logs",
        icon: RefreshCw,
        title: "Purge Old Audit Logs",
        description: "Permanently delete audit log entries older than 90 days. This cannot be reversed.",
        buttonLabel: "Purge Logs > 90 Days",
        buttonClass: "bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/20 text-amber-300",
        requiresConfirm: true,
      },
      {
        id: "reset-platform",
        icon: Trash2,
        title: "Full Platform Reset",
        description: "Delete ALL user-generated content — courses, enrollments, messages, reviews, and moderation records. Auth users are NOT deleted. This is irreversible.",
        buttonLabel: "Reset Platform Content",
        buttonClass: "bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/20 text-rose-300",
        requiresConfirm: true,
      },
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/15 bg-rose-500/[0.03] p-4">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-300">Proceed with extreme caution</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
              Actions in this section are destructive and irreversible. Type <code className="font-mono text-rose-300 bg-rose-500/10 px-1 rounded">CONFIRM</code> in the box below to unlock all danger actions.
            </p>
          </div>
        </div>

        {/* Confirmation unlock input */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 block">
            Type CONFIRM to unlock danger actions
          </label>
          <input
            type="text"
            value={dangerConfirm}
            onChange={(e) => setDangerConfirm(e.target.value)}
            placeholder="CONFIRM"
            className={`w-full max-w-xs bg-zinc-950/50 border rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-700 focus:outline-none transition-all ${
              isDangerConfirmed
                ? "border-rose-500/50 ring-1 ring-rose-500/20"
                : "border-white/[0.07] focus:border-zinc-500/50"
            }`}
          />
          {isDangerConfirmed && (
            <p className="mt-2 text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Danger actions unlocked — proceed carefully
            </p>
          )}
        </div>

        {/* Danger actions */}
        <div className="space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            const locked = action.requiresConfirm && !isDangerConfirmed;
            return (
              <div
                key={action.id}
                className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-opacity ${
                  locked ? "opacity-50" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-zinc-400" />
                      <p className="text-sm font-bold text-white">{action.title}</p>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{action.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      if (!locked) {
                        if (action.requiresConfirm) {
                          alert(`⚠️ ${action.title} — This would execute in a production environment. Demo mode: no changes made.`);
                        } else {
                          alert(`📥 ${action.title} — Export initiated. In production, a download link would be emailed to ${supportEmail}.`);
                        }
                      }
                    }}
                    className={`shrink-0 inline-flex items-center gap-2 border px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:cursor-not-allowed ${action.buttonClass}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {action.buttonLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── Render ── */

  const tabRenderers: Record<TabId, () => React.ReactNode> = {
    general: renderGeneral,
    security: renderSecurity,
    limits: renderLimits,
    notifications: renderNotifications,
    billing: renderBilling,
    danger: renderDanger,
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Platform Configuration</h2>
        <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">
          Manage security policies, limits, notifications, and billing settings
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: Tab nav */}
        <nav className="xl:w-56 shrink-0">
          <div className="xl:sticky xl:top-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2 space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDanger = tab.id === "danger";
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? isDanger
                        ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20"
                        : "bg-violet-500/15 text-white ring-1 ring-violet-500/20"
                      : isDanger
                        ? "text-rose-400/70 hover:bg-rose-500/[0.06] hover:text-rose-300"
                        : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? isDanger ? "text-rose-400" : "text-violet-300"
                        : isDanger ? "text-rose-500/60" : "text-zinc-600"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right: Active panel */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSave}>
            {/* Panel content */}
            <div>{tabRenderers[activeTab]()}</div>

            {/* Sticky save bar (hidden on danger/billing tabs which have no saveable fields) */}
            {activeTab !== "danger" && activeTab !== "billing" && (
              <div className="sticky bottom-4 mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl transition-all cursor-pointer disabled:opacity-70 ${
                    saveSuccess
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-violet-600 hover:bg-violet-700 text-white"
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Settings Saved!
                    </>
                  ) : isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
