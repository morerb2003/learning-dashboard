import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = AlertCircle,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01] ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] text-zinc-400 border border-white/5 mb-4 shadow-inner">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-bold text-white mb-1.5">{title}</h4>
      <p className="max-w-sm text-xs font-medium text-zinc-500 leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this section. Please try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-rose-500/20 bg-rose-500/[0.03] ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
      <p className="max-w-md text-xs text-rose-300/80 mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="danger"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry
        </Button>
      )}
    </div>
  );
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeStyles = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };
  return (
    <div className={`flex items-center justify-center p-6 ${className}`}>
      <div
        className={`${sizeStyles[size]} rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin`}
      />
    </div>
  );
}

export function SkeletonPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse ${className}`}
    />
  );
}
