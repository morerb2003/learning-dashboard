"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, BookOpen, CheckCircle2, GraduationCap, Loader2, Mail, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrength, { getPasswordStrength } from "@/components/auth/PasswordStrength";

type SignupRole = "student" | "teacher";

export default function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<SignupRole>("student");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (passwordStrength.score < 3) {
      setError("Use at least 8 characters with a mix of letters and numbers.");
      return;
    }

    if (!acceptedTerms) {
      setError("Accept the terms and conditions to create your account.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFullName = fullName.trim();

    setIsSubmitting(true);

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set(
      "next",
      getSafeRedirectPath(new URLSearchParams(window.location.search).get("next"))
    );

    const { data, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: normalizedFullName,
          role,
        },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    setIsSubmitting(false);

    if (authError) {
      setError(
        authError.message.toLowerCase().includes("database error")
          ? "Registration is blocked by the database profile trigger. Run fix-registration.sql in Supabase SQL Editor, then try again."
          : authError.message
      );
      return;
    }

    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }

    setMessage(
      role === "teacher"
        ? "Check your inbox to verify your email. Teacher access will stay pending until an admin approves it."
        : "Check your inbox to confirm your email, then sign in."
    );
    setTimeout(() => {
      router.replace("/login?registered=1");
    }, 1800);
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <label htmlFor="fullName" className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-200">Full Name</span>
          <span className="relative block">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white shadow-inner shadow-black/10 outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-cyan-300/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-300/10"
              placeholder="Your name"
            />
          </span>
        </label>

        <label htmlFor="email" className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-200">Email</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white shadow-inner shadow-black/10 outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-cyan-300/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-300/10"
              placeholder="you@example.com"
            />
          </span>
        </label>

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />

        <PasswordStrength password={password} />

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Repeat password"
        />

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-zinc-200">Select Role</legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: "student" as const,
                title: "Student",
                description: "Start learning today",
                icon: BookOpen,
              },
              {
                value: "teacher" as const,
                title: "Teacher",
                description: "Requires approval",
                icon: GraduationCap,
              },
            ].map((option) => {
              const Icon = option.icon;
              const selected = role === option.value;

              return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                    selected
                      ? "border-cyan-300/60 bg-cyan-300/10 shadow-lg shadow-cyan-500/10"
                      : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={selected}
                    onChange={() => setRole(option.value)}
                    className="sr-only"
                  />
                  <span className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? "bg-cyan-300 text-zinc-950" : "bg-white/10 text-zinc-300"}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">{option.title}</span>
                      <span className="mt-1 block text-xs text-zinc-500">{option.description}</span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-medium text-zinc-400">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/10 bg-zinc-950 accent-cyan-300"
          />
          <span>
            I agree to the{" "}
            <Link href="#" className="font-bold text-cyan-200 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60">
              Terms & Conditions
            </Link>
          </span>
        </label>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.985 }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 px-6 text-sm font-black text-zinc-950 shadow-xl shadow-cyan-500/20 outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 motion-safe:animate-spin" />}
          {isSubmitting ? "Creating account..." : "Create account"}
        </motion.button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleButton mode="register" />

      <p className="text-center text-sm font-medium text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-cyan-200 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60">
          Login
        </Link>
      </p>
    </div>
  );
}
