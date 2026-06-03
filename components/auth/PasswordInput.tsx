"use client";

import { InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export default function PasswordInput({ label, id, className = "", ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label htmlFor={inputId} className="block space-y-2">
      <span className="text-sm font-semibold text-zinc-200">{label}</span>
      <span className="relative block">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          {...props}
          id={inputId}
          type={showPassword ? "text" : "password"}
          className={`h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-12 text-sm text-white shadow-inner shadow-black/10 outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-cyan-300/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-300/10 ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}
