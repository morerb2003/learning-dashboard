import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-zinc-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-xl bg-white/[0.03] border text-xs text-white placeholder-zinc-500
              py-2.5 px-3.5 transition-colors focus:outline-none focus:ring-1
              ${leftIcon ? "pl-10" : ""}
              ${
                error
                  ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                  : "border-white/10 hover:border-white/20 focus:border-violet-500 focus:ring-violet-500/20"
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] font-medium text-rose-400">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-zinc-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-xl bg-white/[0.03] border text-xs text-white placeholder-zinc-500
            p-3.5 transition-colors focus:outline-none focus:ring-1
            ${
              error
                ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-white/10 hover:border-white/20 focus:border-violet-500 focus:ring-violet-500/20"
            }
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-[11px] font-medium text-rose-400">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-zinc-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
