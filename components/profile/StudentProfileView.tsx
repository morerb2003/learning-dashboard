"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  GraduationCap,
  Key,
  Layers,
  Lock,
  Mail,
  MapPin,
  Phone,
  Play,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import ProfileLayout, { TabItem } from "./ProfileLayout";
import { FullProfileData } from "@/types/profile";
import {
  updateBaseProfile,
  updateStudentProfile,
  updateUserPassword,
} from "@/lib/profile/actions";

interface StudentProfileViewProps {
  data: FullProfileData;
}

const studentTabs: TabItem[] = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "personal", label: "Personal Info", icon: User },
  { id: "learning", label: "Learning & Skills", icon: BookOpen },
  { id: "achievements", label: "Certificates", icon: Award },
  { id: "subscription", label: "Subscription", icon: Zap },
  { id: "privacy", label: "Privacy & Notifications", icon: Shield },
  { id: "security", label: "Security", icon: Lock },
];

export default function StudentProfileView({ data }: StudentProfileViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Base profile form state
  const [fullName, setFullName] = useState(data.base.full_name || "");
  const [username, setUsername] = useState(data.base.username || "");
  const [phone, setPhone] = useState(data.base.phone || "");
  const [bio, setBio] = useState(data.base.bio || "");
  const [location, setLocation] = useState(data.base.location || "");
  const [website, setWebsite] = useState(data.base.website || "");
  const [linkedinUrl, setLinkedinUrl] = useState(data.base.linkedin_url || "");
  const [githubUrl, setGithubUrl] = useState(data.base.github_url || "");

  // Student specific form state
  const student = data.student;
  const [dob, setDob] = useState(student?.date_of_birth || "");
  const [gender, setGender] = useState(student?.gender || "prefer_not_to_say");
  const [skills, setSkills] = useState<string[]>(student?.skills || ["TypeScript", "Next.js", "TailwindCSS"]);
  const [newSkill, setNewSkill] = useState("");
  const [learningGoals, setLearningGoals] = useState<string[]>(
    student?.learning_goals || ["Master Fullstack Web Development", "Complete Cloud Deployment Certification"]
  );
  const [newGoal, setNewGoal] = useState("");

  // Privacy & Preferences state
  const [visibility, setVisibility] = useState(student?.profile_visibility || "public");
  const [showProgress, setShowProgress] = useState(student?.show_learning_progress ?? true);
  const [showCertificates, setShowCertificates] = useState(student?.show_certificates ?? true);
  const [showAchievements, setShowAchievements] = useState(student?.show_achievements ?? true);
  const [notifications, setNotifications] = useState(
    student?.notification_preferences || {
      email: true,
      course_updates: true,
      quiz_reminders: true,
      community_activity: true,
    }
  );

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Stats
  const stats = data.studentStats || {
    enrolledCoursesCount: data.enrolledCourses?.length || 0,
    completedCoursesCount: 1,
    inProgressCoursesCount: (data.enrolledCourses?.length || 1) - 1,
    learningHours: 28,
    overallProgress: 64,
    certificatesEarnedCount: data.certificates?.length || 1,
    currentStreak: 12,
    averageQuizScore: 88,
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await updateBaseProfile({
      full_name: fullName,
      username,
      phone,
      bio,
      location,
      website,
      linkedin_url: linkedinUrl,
      github_url: githubUrl,
    });

    setIsSubmitting(false);
    setStatusMessage({
      text: res.message,
      type: res.success ? "success" : "error",
    });
  };

  const handleSaveLearning = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await updateStudentProfile({
      date_of_birth: dob,
      gender,
      skills,
      learning_goals: learningGoals,
    });

    setIsSubmitting(false);
    setStatusMessage({
      text: res.message,
      type: res.success ? "success" : "error",
    });
  };

  const handleSavePrivacy = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await updateStudentProfile({
      profile_visibility: visibility as any,
      show_learning_progress: showProgress,
      show_certificates: showCertificates,
      show_achievements: showAchievements,
      notification_preferences: notifications,
    });

    setIsSubmitting(false);
    setStatusMessage({
      text: res.message,
      type: res.success ? "success" : "error",
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

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const addGoal = () => {
    if (newGoal.trim() && !learningGoals.includes(newGoal.trim())) {
      setLearningGoals([...learningGoals, newGoal.trim()]);
      setNewGoal("");
    }
  };

  const removeGoal = (goalToRemove: string) => {
    setLearningGoals(learningGoals.filter((g) => g !== goalToRemove));
  };

  // Header quick stats strip
  const headerStats = (
    <div className="flex items-center gap-3">
      <div className="px-4 py-2 rounded-2xl glass-card border border-amber-500/20 bg-amber-500/5 flex items-center gap-2">
        <Flame className="w-4 h-4 text-amber-400" />
        <div>
          <div className="text-[10px] uppercase font-bold text-amber-300">Streak</div>
          <div className="text-sm font-black text-white">{stats.currentStreak} Days</div>
        </div>
      </div>
      <div className="px-4 py-2 rounded-2xl glass-card border border-cyan-500/20 bg-cyan-500/5 flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-cyan-400" />
        <div>
          <div className="text-[10px] uppercase font-bold text-cyan-300">Courses</div>
          <div className="text-sm font-black text-white">{stats.enrolledCoursesCount} Enrolled</div>
        </div>
      </div>
    </div>
  );

  return (
    <ProfileLayout
      baseProfile={data.base}
      tabs={studentTabs}
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
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl glass-card border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Progress</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats.overallProgress}%</div>
              <p className="text-[11px] text-zinc-400">Average completion rate</p>
            </div>

            <div className="p-5 rounded-3xl glass-card border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Quiz Score</span>
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats.averageQuizScore}%</div>
              <p className="text-[11px] text-zinc-400">Across all assessments</p>
            </div>

            <div className="p-5 rounded-3xl glass-card border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Certificates</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats.certificatesEarnedCount}</div>
              <p className="text-[11px] text-zinc-400">Verified credentials</p>
            </div>

            <div className="p-5 rounded-3xl glass-card border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Learning Time</span>
                <BookOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats.learningHours} hrs</div>
              <p className="text-[11px] text-zinc-400">Recorded study sessions</p>
            </div>
          </div>

          {/* Enrolled Courses Highlights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Courses in Progress
              </h3>
              <Link href="/learning" className="text-xs font-bold text-cyan-300 hover:underline">
                View All Learning Workspace &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.enrolledCourses && data.enrolledCourses.length > 0 ? (
                data.enrolledCourses.map((course) => (
                  <div
                    key={course.id}
                    className="p-5 rounded-3xl glass-card border border-white/5 flex flex-col justify-between gap-4 hover:border-white/10 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-400">
                          {course.category || "General"}
                        </span>
                        <span className="text-xs font-bold text-cyan-400">{course.progress}%</span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{course.title}</h4>
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/course/${course.id}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" /> Continue Learning
                    </Link>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 p-8 rounded-3xl glass-card border border-white/5 text-center space-y-3">
                  <p className="text-sm text-zinc-400">You are not enrolled in any courses yet.</p>
                  <Link
                    href="/dashboard?tab=courses"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-400 text-zinc-950 text-xs font-black"
                  >
                    Explore Catalog
                  </Link>
                </div>
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
              <User className="w-4 h-4 text-cyan-400" /> Basic & Social Identity
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
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={data.base.email || ""}
                  disabled
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/30 border border-white/5 text-sm text-zinc-500 cursor-not-allowed"
                />
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Portfolio Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://myportfolio.dev"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">LinkedIn URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">GitHub URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bio / About Me</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Passionate learner exploring cloud computing and modern full-stack development..."
                  className="w-full p-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 text-zinc-950 font-black text-sm shadow-xl shadow-cyan-500/10 hover:brightness-110 disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Saving..." : "Save Personal Info"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: LEARNING & SKILLS */}
      {activeTab === "learning" && (
        <div className="space-y-6 max-w-4xl">
          {/* Skills Management */}
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                Skills & Technologies
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Showcase competencies you are learning or have mastered.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-xs font-bold text-cyan-300"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-rose-400 text-zinc-500 transition-colors ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add a new skill (e.g. Docker, GraphQL)..."
                className="flex-1 h-10 px-4 rounded-xl bg-zinc-900/60 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400/50"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
              >
                Add
              </button>
            </div>
          </div>

          {/* Learning Goals */}
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Active Learning Goals
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Set milestones to keep your learning path clear and motivated.
              </p>
            </div>

            <div className="space-y-2.5">
              {learningGoals.map((goal) => (
                <div
                  key={goal}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 text-xs font-medium text-zinc-200"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {goal}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeGoal(goal)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
                placeholder="Add a new milestone (e.g. Complete 5 quizzes with >90%)..."
                className="flex-1 h-10 px-4 rounded-xl bg-zinc-900/60 border border-white/10 text-xs text-white focus:outline-none focus:border-violet-400/50"
              />
              <button
                type="button"
                onClick={addGoal}
                className="px-4 h-10 rounded-xl bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 text-xs font-bold"
              >
                Add Goal
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleSaveLearning}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:brightness-110 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Save Learning & Skills
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CERTIFICATES & ACHIEVEMENTS */}
      {activeTab === "achievements" && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Earned Course Certificates
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Official certificates issued upon 100% course completion.
              </p>
            </div>

            {data.certificates && data.certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-5 rounded-2xl bg-zinc-900/60 border border-amber-500/20 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-amber-300">Verified</span>
                        <span className="text-[10px] text-zinc-500">{new Date(cert.issued_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{cert.course_title}</h4>
                      <p className="text-[10px] font-mono text-zinc-400">ID: {cert.certificate_number}</p>
                    </div>

                    <Link
                      href={`/course/${cert.id}/certificate`}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Certificate
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-zinc-900/30 border border-white/5 text-center space-y-2">
                <Award className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-400">No certificates issued yet.</p>
                <p className="text-xs text-zinc-500">Complete all lessons in a course to receive your verified certificate.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTION */}
      {activeTab === "subscription" && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Current Membership Plan
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Manage your billing cycle and platform benefits.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                Active &bull; Pro Plan
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Billing Cycle</span>
                <div className="text-sm font-bold text-white">Annual ($149/year)</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Next Renewal Date</span>
                <div className="text-sm font-bold text-white">October 24, 2026</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Payment Method</span>
                <div className="text-sm font-bold text-white">&bull;&bull;&bull;&bull; 4242 (Visa)</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Have a discount coupon?</div>
                <div className="text-[11px] text-zinc-400">Apply promotional codes for subscription discounts or free courses.</div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="COUPON2026"
                  className="h-9 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white uppercase focus:outline-none"
                />
                <button
                  type="button"
                  className="px-4 h-9 rounded-xl bg-cyan-400 text-zinc-950 text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PRIVACY & NOTIFICATIONS */}
      {activeTab === "privacy" && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Privacy & Visibility Controls
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Public Profile Visibility</div>
                  <div className="text-xs text-zinc-400">Allow other students and teachers to view your bio and skills.</div>
                </div>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="h-10 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="public">Public (Everyone)</option>
                  <option value="students_only">Platform Students Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div>
                  <div className="text-sm font-bold text-white">Show Learning Progress</div>
                  <div className="text-xs text-zinc-400">Display course completion percentages on community leaderboards.</div>
                </div>
                <input
                  type="checkbox"
                  checked={showProgress}
                  onChange={(e) => setShowProgress(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-400"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div>
                  <div className="text-sm font-bold text-white">Show Certificates Publicly</div>
                  <div className="text-xs text-zinc-400">Allow employers and peers to verify your completion badges.</div>
                </div>
                <input
                  type="checkbox"
                  checked={showCertificates}
                  onChange={(e) => setShowCertificates(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-400"
                />
              </div>
            </div>

            <h3 className="text-base font-bold text-white border-b border-white/5 pt-6 pb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-violet-400" />
              Notification Preferences
            </h3>

            <div className="space-y-3">
              {[
                { key: "email", label: "Email Notifications", desc: "Receive weekly digest and critical system alerts" },
                { key: "course_updates", label: "Course Updates", desc: "Alert when instructors add new lessons or assignments" },
                { key: "quiz_reminders", label: "Quiz Reminders", desc: "Remind me before deadlines on upcoming quizzes" },
              ].map((item) => (
                <label key={item.key} className="flex items-start justify-between cursor-pointer py-2">
                  <div>
                    <div className="text-sm font-bold text-white">{item.label}</div>
                    <div className="text-xs text-zinc-400">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={(notifications as any)[item.key]}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        [item.key]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-violet-400 mt-1"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleSavePrivacy}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:brightness-110 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SECURITY */}
      {activeTab === "security" && (
        <div className="space-y-6 max-w-4xl">
          {/* Password Change */}
          <form onSubmit={handlePasswordChange} className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" /> Change Account Password
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

          {/* Account Details & Danger Zone */}
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-rose-500/20 bg-rose-500/5 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" /> Danger Zone
            </div>
            <p className="text-xs text-zinc-400">
              Deleting your account will permanently remove all enrolled course progress, certificates, quiz attempts, and personal data. This action cannot be reversed.
            </p>
            <button
              type="button"
              onClick={() => alert("Please contact support to permanently delete your account.")}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition"
            >
              Request Account Deletion
            </button>
          </div>
        </div>
      )}
    </ProfileLayout>
  );
}
