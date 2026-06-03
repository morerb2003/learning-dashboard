"use client";

import { CheckCircle2 } from "lucide-react";

export type PasswordStrengthValue = {
  score: number;
  label: "Required" | "Weak" | "Good" | "Strong";
  helper: string;
  color: string;
};

export function getPasswordStrength(password: string): PasswordStrengthValue {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  if (!password) {
    return {
      score: 0,
      label: "Required",
      helper: "Use 8+ characters with letters and numbers.",
      color: "bg-zinc-700",
    };
  }

  if (score <= 2) {
    return {
      score,
      label: "Weak",
      helper: "Add uppercase letters, numbers, or symbols.",
      color: "bg-rose-500",
    };
  }

  if (score <= 4) {
    return {
      score,
      label: "Good",
      helper: "Almost there. A symbol makes it stronger.",
      color: "bg-amber-400",
    };
  }

  return {
    score,
    label: "Strong",
    helper: "Great password strength.",
    color: "bg-emerald-400",
  };
}

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);
  const width = password ? Math.max(strength.score, 1) * 20 : 8;

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-zinc-400">Password strength</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-200">
          {strength.label === "Strong" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
          {strength.label}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500">{strength.helper}</p>
    </div>
  );
}
