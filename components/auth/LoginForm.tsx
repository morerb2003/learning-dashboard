"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AlertCircle, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LoginButton from "@/components/auth/LoginButton";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem("aura_remembered_email") || "";
  });
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(window.localStorage.getItem("aura_remembered_email"));
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return new URLSearchParams(window.location.search).get("registered")
      ? "Account created. Confirm your email if needed, then sign in."
      : "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (rememberEmail) {
      window.localStorage.setItem("aura_remembered_email", email);
    } else {
      window.localStorage.removeItem("aura_remembered_email");
    }

    const nextPath = new URLSearchParams(window.location.search).get("next");
    const redirectTo = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
    router.replace(redirectTo);
    router.refresh();
  };

  const handlePasswordReset = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError("Enter your email first, then request a reset link.");
      return;
    }

    setIsSendingReset(true);

    const supabase = createClient();
    const resetUrl = new URL("/auth/callback", window.location.origin);
    resetUrl.searchParams.set("next", "/reset-password");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl.toString(),
    });

    setIsSendingReset(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Password reset link sent. Check your inbox.");
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
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
            {message}
          </div>
        )}

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
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-white/5 bg-zinc-950/40 py-2.5 pl-10 pr-11 text-sm text-white placeholder-zinc-600 transition-colors focus:border-violet-500/50 focus:outline-none"
              placeholder="Enter your password"
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
        </label>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(event) => setRememberEmail(event.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-zinc-950 accent-violet-600"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={isSendingReset}
            className="text-xs font-bold text-violet-400 transition-colors hover:text-violet-300 disabled:opacity-60"
          >
            {isSendingReset ? "Sending..." : "Forgot password?"}
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/10 transition-all hover:bg-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
        >
          <Sparkles className="h-4 w-4" />
          {isSubmitting ? "Signing in..." : "Sign in with email"}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">or</span>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <LoginButton />

      <p className="text-center text-xs font-medium text-zinc-500">
        New to AURA?{" "}
        <Link href="/register" className="font-bold text-violet-400 hover:text-violet-300">
          Create an account
        </Link>
      </p>
    </div>
  );
}
