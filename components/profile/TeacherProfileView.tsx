"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  GraduationCap,
  Key,
  Layers,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Star,
  Tag,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import ProfileLayout, { TabItem } from "./ProfileLayout";
import { FullProfileData } from "@/types/profile";
import {
  updateBaseProfile,
  updateTeacherProfile,
  updateUserPassword,
} from "@/lib/profile/actions";

interface TeacherProfileViewProps {
  data: FullProfileData;
}

const teacherTabs: TabItem[] = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "personal", label: "Personal Info", icon: User },
  { id: "professional", label: "Professional & Teaching", icon: Briefcase },
  { id: "courses", label: "My Courses", icon: BookOpen },
  { id: "earnings", label: "Earnings & Payouts", icon: DollarSign },
  { id: "verification", label: "Verification Center", icon: ShieldCheck },
  { id: "security", label: "Security", icon: Lock },
];

export default function TeacherProfileView({ data }: TeacherProfileViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Base profile state
  const [fullName, setFullName] = useState(data.base.full_name || "");
  const [username, setUsername] = useState(data.base.username || "");
  const [phone, setPhone] = useState(data.base.phone || "");
  const [bio, setBio] = useState(data.base.bio || "");
  const [location, setLocation] = useState(data.base.location || "");
  const [website, setWebsite] = useState(data.base.website || "");
  const [linkedinUrl, setLinkedinUrl] = useState(data.base.linkedin_url || "");
  const [githubUrl, setGithubUrl] = useState(data.base.github_url || "");

  // Teacher specific state
  const teacher = data.teacher;
  const [headline, setHeadline] = useState(
    teacher?.headline || "Java & Spring Boot Developer | Backend Engineering Instructor"
  );
  const [experienceYears, setExperienceYears] = useState(teacher?.experience_years ?? 6);
  const [organization, setOrganization] = useState(teacher?.organization || "AURA Learning Tech");
  const [education, setEducation] = useState(teacher?.education || "B.S. in Computer Science, IIT Bombay");
  const [teachingExperience, setTeachingExperience] = useState(
    teacher?.teaching_experience || "Over 5 years of training software engineers in enterprise system design."
  );
  const [teachingStyle, setTeachingStyle] = useState(
    teacher?.teaching_style || "Hands-on coding, live architectural teardowns, and practical real-world exercises."
  );
  const [deliveryPref, setDeliveryPref] = useState(teacher?.delivery_preference || "online");
  const [availableHours, setAvailableHours] = useState(teacher?.available_hours ?? 20);
  const [studentCapacity, setStudentCapacity] = useState(teacher?.student_capacity ?? 250);

  const [expertise, setExpertise] = useState<string[]>(
    teacher?.expertise || ["Spring Boot", "Microservices", "PostgreSQL", "Docker", "REST API Design"]
  );
  const [newExpertise, setNewExpertise] = useState("");

  const [certifications, setCertifications] = useState<string[]>(
    teacher?.certifications || ["Oracle Certified Professional Java Developer", "AWS Certified Solutions Architect"]
  );
  const [newCert, setNewCert] = useState("");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const stats = data.teacherStats || {
    totalCourses: data.teacherCourses?.length || 12,
    totalStudents: 2540,
    totalRevenue: 185000,
    averageRating: 4.8,
    totalReviews: 426,
    completionRate: 87,
    availableBalance: 42000,
    pendingEarnings: 15000,
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

  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await updateTeacherProfile({
      headline,
      experience_years: Number(experienceYears),
      organization,
      education,
      teaching_experience: teachingExperience,
      teaching_style: teachingStyle,
      delivery_preference: deliveryPref as any,
      available_hours: Number(availableHours),
      student_capacity: Number(studentCapacity),
      expertise,
      certifications,
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

  const addExpertise = () => {
    if (newExpertise.trim() && !expertise.includes(newExpertise.trim())) {
      setExpertise([...expertise, newExpertise.trim()]);
      setNewExpertise("");
    }
  };

  const removeExpertise = (item: string) => {
    setExpertise(expertise.filter((e) => e !== item));
  };

  const addCertification = () => {
    if (newCert.trim() && !certifications.includes(newCert.trim())) {
      setCertifications([...certifications, newCert.trim()]);
      setNewCert("");
    }
  };

  const removeCertification = (item: string) => {
    setCertifications(certifications.filter((c) => c !== item));
  };

  // Header quick stats strip
  const headerStats = (
    <div className="flex items-center gap-3">
      <div className="px-4 py-2 rounded-2xl glass-card border border-amber-500/20 bg-amber-500/5 flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        <div>
          <div className="text-[10px] uppercase font-bold text-amber-300">Rating</div>
          <div className="text-sm font-black text-white">{stats.averageRating} &bull; {stats.totalReviews} reviews</div>
        </div>
      </div>
      <div className="px-4 py-2 rounded-2xl glass-card border border-sky-500/20 bg-sky-500/5 flex items-center gap-2">
        <Users className="w-4 h-4 text-sky-400" />
        <div>
          <div className="text-[10px] uppercase font-bold text-sky-300">Students</div>
          <div className="text-sm font-black text-white">{stats.totalStudents.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );

  return (
    <ProfileLayout
      baseProfile={data.base}
      tabs={teacherTabs}
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
          {/* Professional Credibility Banner */}
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-zinc-900/50 to-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-sky-300 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
                Professional Credibility
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white">{headline}</h2>
              <p className="text-xs md:text-sm text-zinc-300 max-w-2xl">{teachingExperience}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/teacher/courses/create"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-teal-400 text-zinc-950 text-xs font-black shadow-lg shadow-sky-500/20 hover:brightness-110 transition"
              >
                <Plus className="w-4 h-4" /> Create New Course
              </Link>
              <Link
                href="/teacher/earnings"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 transition"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" /> View Payouts
              </Link>
            </div>
          </div>

          {/* Teacher Key Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Courses</span>
              <div className="text-2xl font-black text-white">{stats.totalCourses}</div>
              <p className="text-[10px] text-zinc-400">Created & active</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Students</span>
              <div className="text-2xl font-black text-sky-400">{stats.totalStudents.toLocaleString()}</div>
              <p className="text-[10px] text-zinc-400">Active enrollments</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Revenue</span>
              <div className="text-2xl font-black text-emerald-400">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-[10px] text-zinc-400">All-time earned</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rating</span>
              <div className="text-2xl font-black text-amber-400 flex items-center gap-1">
                {stats.averageRating}
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <p className="text-[10px] text-zinc-400">{stats.totalReviews} reviews</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Completion</span>
              <div className="text-2xl font-black text-violet-400">{stats.completionRate}%</div>
              <p className="text-[10px] text-zinc-400">Student success rate</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</span>
              <div className="text-sm font-black text-emerald-300 mt-1 uppercase tracking-wider">
                {teacher?.verification_status || "Verified"}
              </div>
              <p className="text-[10px] text-zinc-400">Identity & Degree</p>
            </div>
          </div>

          {/* Quick Courses Teaser */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" /> Recent Authored Courses
              </h3>
              <Link href="/teacher/courses" className="text-xs font-bold text-sky-300 hover:underline">
                Manage Courses Hub &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.teacherCourses && data.teacherCourses.length > 0 ? (
                data.teacherCourses.slice(0, 3).map((course) => (
                  <div key={course.id} className="p-5 rounded-2xl glass-card border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-0.5 rounded-full bg-white/5">
                        {course.category || "General"}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {course.price ? `₹${course.price}` : "Free"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{course.title}</h4>
                    <Link
                      href={`/course/${course.id}`}
                      className="inline-flex items-center gap-1.5 text-xs text-sky-300 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Preview Course
                    </Link>
                  </div>
                ))
              ) : (
                <div className="md:col-span-3 p-8 rounded-3xl glass-card border border-white/5 text-center space-y-3">
                  <p className="text-sm text-zinc-400">You have not published any courses yet.</p>
                  <Link
                    href="/teacher/courses/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-400 text-zinc-950 text-xs font-black"
                  >
                    <Plus className="w-4 h-4" /> Create First Course
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
              <User className="w-4 h-4 text-sky-400" /> Basic Identity & Reach
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Instructor Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="instructor_handle"
                    className="w-full h-11 pl-9 pr-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email (System)</label>
                <input
                  type="email"
                  value={data.base.email || ""}
                  disabled
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/30 border border-white/5 text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Base Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Bengaluru, India"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Official Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://instructor-portfolio.com"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">LinkedIn Profile</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/instructor"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">GitHub / Code Repository</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/instructor"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Instructor Biography</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Experienced software architect committed to teaching best engineering practices..."
                  className="w-full p-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-teal-400 text-zinc-950 font-black text-sm shadow-xl shadow-sky-500/10 hover:brightness-110 disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Saving..." : "Save Identity Info"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: PROFESSIONAL & TEACHING */}
      {activeTab === "professional" && (
        <form onSubmit={handleSaveProfessional} className="space-y-6 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sky-400" />
              Credentials & Teaching Pedagogy
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Professional Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Java & Spring Boot Developer | Backend Engineering Instructor"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Years of Experience</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  min={0}
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Current Organization / Employer</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="AURA Labs, Google, Amazon..."
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Highest Education & Institution</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="M.S. in Software Engineering, Carnegie Mellon"
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Teaching Preference</label>
                <select
                  value={deliveryPref}
                  onChange={(e) => setDeliveryPref(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-2xl bg-zinc-900/60 border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="online">Online Pre-Recorded & Live</option>
                  <option value="hybrid">Hybrid Cohort</option>
                  <option value="offline">In-person Workshops</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Weekly Available Hours</label>
                <input
                  type="number"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(Number(e.target.value))}
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Teaching Style & Methodology</label>
                <textarea
                  value={teachingStyle}
                  onChange={(e) => setTeachingStyle(e.target.value)}
                  rows={3}
                  placeholder="Interactive demos, practical coding exercises, and active student Q&A..."
                  className="w-full p-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
                />
              </div>
            </div>

            {/* Specializations & Certifications */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Areas of Expertise / Specializations
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {expertise.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-bold text-sky-300"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeExpertise(item)}
                        className="text-zinc-500 hover:text-rose-400 ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())}
                    placeholder="Add specialization..."
                    className="flex-1 h-10 px-4 rounded-xl bg-zinc-900/60 border border-white/10 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addExpertise}
                    className="px-4 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Professional Certifications
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {certifications.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-300"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeCertification(item)}
                        className="text-zinc-500 hover:text-rose-400 ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCertification())}
                    placeholder="Add certification (e.g. AWS Solutions Architect)..."
                    className="flex-1 h-10 px-4 rounded-xl bg-zinc-900/60 border border-white/10 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCertification}
                    className="px-4 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-teal-400 text-zinc-950 font-black text-sm shadow-xl shadow-sky-500/10 hover:brightness-110 disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Saving..." : "Save Professional Details"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: MY COURSES */}
      {activeTab === "courses" && (
        <div className="space-y-6 max-w-5xl">
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-400" /> Authored Courses
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Manage draft, published, and pending courses.</p>
              </div>
              <Link
                href="/teacher/courses/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-400 text-zinc-950 text-xs font-black"
              >
                <Plus className="w-4 h-4" /> Create Course
              </Link>
            </div>

            <div className="space-y-3">
              {data.teacherCourses && data.teacherCourses.length > 0 ? (
                data.teacherCourses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{course.title}</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            course.is_published
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          }`}
                        >
                          {course.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {course.category || "General"} &bull; ₹{course.price}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/course/${course.id}`}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white"
                      >
                        View
                      </Link>
                      <Link
                        href={`/teacher/courses`}
                        className="px-3 py-1.5 rounded-xl bg-sky-400/10 hover:bg-sky-400/20 text-xs font-bold text-sky-300"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 text-center py-6">No courses created yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EARNINGS & PAYOUTS */}
      {activeTab === "earnings" && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Teacher Revenue & Payouts
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Platform revenue share and bank withdrawal status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-300">Total Revenue</span>
                <div className="text-2xl font-black text-white">₹{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-[10px] text-zinc-400">Lifetime course sales</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-sky-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-sky-300">Available Balance</span>
                <div className="text-2xl font-black text-white">₹{stats.availableBalance.toLocaleString()}</div>
                <p className="text-[10px] text-zinc-400">Ready for transfer</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-amber-500/20 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-300">Pending Clearance</span>
                <div className="text-2xl font-black text-white">₹{stats.pendingEarnings.toLocaleString()}</div>
                <p className="text-[10px] text-zinc-400">Next cycle: Friday</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Platform Commission Structure</div>
                <div className="text-[11px] text-zinc-400">Standard instructor tier: 85% to teacher / 15% platform infrastructure.</div>
              </div>
              <Link
                href="/teacher/earnings"
                className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-black"
              >
                Request Withdrawal
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: VERIFICATION CENTER */}
      {activeTab === "verification" && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Instructor Verification Status
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Official credentials establishing marketplace credibility.</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white">Government Identity Verification</div>
                  <div className="text-xs text-zinc-400">Passport or National ID verification.</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white">Academic Degree & Qualification</div>
                  <div className="text-xs text-zinc-400">University degree transcript verification.</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white">Industry Certification Badges</div>
                  <div className="text-xs text-zinc-400">Vendor certifications (AWS, Oracle, Google Cloud).</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SECURITY */}
      {activeTab === "security" && (
        <div className="space-y-6 max-w-4xl">
          <form onSubmit={handlePasswordChange} className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-6">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" /> Change Instructor Password
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
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
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
                  className="w-full h-11 px-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400/50"
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
    </ProfileLayout>
  );
}
