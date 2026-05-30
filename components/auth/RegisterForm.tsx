"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function getPasswordStrength(password: string) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  if (!password) {
    return { score: 0, label: "Required", color: "bg-zinc-800" };
  }

  if (score <= 2) {
    return { score, label: "Weak", color: "bg-red-500" };
  }

  if (score <= 4) {
    return { score, label: "Good", color: "bg-orange-400" };
  }

  return { score, label: "Strong", color: "bg-emerald-400" };
}

export default function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }

    setMessage("Check your inbox to confirm your email, then sign in.");
    setTimeout(() => {
      router.replace("/login?registered=1");
    }, 1800);
  };

  return (
    <div className="w-full space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <label className="block space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Full Name</span>
          <span className="relative block">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
              className="w-full rounded-xl border border-white/5 bg-zinc-950/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-600 transition-colors focus:border-violet-500/50 focus:outline-none"
              placeholder="Your name"
            />
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Email</span>
          <span className="relative block">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/5 bg-zinc-950/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-600 transition-colors focus:border-violet-500/50 focus:outline-none"
              placeholder="you@aura.edu"
            />
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Password</span>
          <span className="relative block">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-xl border border-white/5 bg-zinc-950/40 py-2.5 pl-10 pr-11 text-sm text-white placeholder-zinc-600 transition-colors focus:border-violet-500/50 focus:outline-none"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-900">
              <span
                className={`block h-full rounded-full transition-all ${passwordStrength.color}`}
                style={{ width: `${Math.max(passwordStrength.score, 1) * 20}%` }}
              />
            </span>
            <span className="w-12 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {passwordStrength.label}
            </span>
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Confirm Password</span>
          <span className="relative block">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-xl border border-white/5 bg-zinc-950/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-600 transition-colors focus:border-violet-500/50 focus:outline-none"
              placeholder="Repeat password"
            />
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-white/5 transition-all hover:bg-zinc-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-xs font-medium text-zinc-500">
        Already registered?{" "}
        <Link href="/login" className="font-bold text-violet-400 hover:text-violet-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
