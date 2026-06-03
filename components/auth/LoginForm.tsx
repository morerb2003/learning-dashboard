"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordInput from "@/components/auth/PasswordInput";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem("aura_remembered_email");
    const registered = new URLSearchParams(window.location.search).get("registered");

    const timer = setTimeout(() => {
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberEmail(true);
      }
      if (registered) {
        setMessage("Account created. Confirm your email if needed, then sign in.");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

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
          autoComplete="current-password"
          required
          placeholder="Enter your password"
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-400">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(event) => setRememberEmail(event.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-zinc-950 accent-cyan-300"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={isSendingReset}
            className="rounded-lg text-sm font-bold text-cyan-200 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:opacity-60"
          >
            {isSendingReset ? "Sending..." : "Forgot password?"}
          </button>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.985 }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 px-6 text-sm font-black text-zinc-950 shadow-xl shadow-cyan-500/20 outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 motion-safe:animate-spin" />}
          {isSubmitting ? "Signing in..." : "Login"}
        </motion.button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleButton />

      <p className="text-center text-sm font-medium text-zinc-500">
        Do not have an account?{" "}
        <Link href="/register" className="font-bold text-cyan-200 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60">
          Register
        </Link>
      </p>
    </div>
  );
}
