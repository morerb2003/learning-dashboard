import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "interactive";
}

export function Card({
  children,
  className = "",
  variant = "glass",
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-zinc-900 border border-white/10 rounded-2xl shadow-xl",
    glass:
      "bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl",
    interactive:
      "bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-violet-500/40 hover:bg-white/[0.04] transition-all duration-300 rounded-2xl shadow-xl group cursor-pointer",
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 sm:p-6 border-b border-white/5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-4 sm:p-5 border-t border-white/5 bg-white/[0.01] rounded-b-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
