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
      "glass-card rounded-2xl shadow-xl",
    interactive:
      "glass-card glass-card-hover rounded-2xl shadow-xl group cursor-pointer transition-all duration-300",
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
