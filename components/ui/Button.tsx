import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 active:scale-[0.97]";

    const variantStyles = {
      primary:
        "btn-shimmer bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:brightness-110 border border-violet-400/30",
      secondary:
        "bg-white/[0.05] text-zinc-200 border border-white/12 hover:bg-white/[0.09] hover:text-white hover:border-white/25 shadow-sm focus:ring-zinc-400",
      outline:
        "bg-transparent text-zinc-300 border border-white/15 hover:bg-white/5 hover:text-white hover:border-white/30 focus:ring-zinc-400",
      ghost:
        "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 focus:ring-zinc-500",
      danger:
        "bg-rose-500/10 text-rose-300 border border-rose-500/25 hover:bg-rose-500/20 hover:text-rose-100 hover:border-rose-500/40 focus:ring-rose-500",
      success:
        "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20 hover:text-emerald-100 hover:border-emerald-500/40 focus:ring-emerald-500",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-xs md:text-sm px-4 py-2.5 gap-2",
      lg: "text-sm md:text-base px-6 py-3 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
