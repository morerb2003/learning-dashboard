import React from "react";

export type BadgeVariant =
  | "student"
  | "teacher"
  | "admin"
  | "active"
  | "inactive"
  | "pending"
  | "verified"
  | "rejected"
  | "completed"
  | "free"
  | "pro"
  | "premium";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "active",
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    student: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    teacher: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    admin: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    active: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    inactive: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    verified: "bg-teal-500/10 text-teal-300 border-teal-500/20",
    rejected: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    completed: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    free: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
    pro: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    premium: "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-200 border-amber-500/30",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[9px] font-bold tracking-wider",
    md: "px-2.5 py-1 text-[10px] font-black tracking-widest",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 uppercase rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
