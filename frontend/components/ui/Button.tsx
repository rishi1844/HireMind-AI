import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 rounded-xl";

  const variants = {
    primary:
      "bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30",
    secondary:
      "glass border border-white/10 text-white hover:bg-white/8 hover:border-white/20",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5",
    danger:
      "bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/30 hover:text-rose-300",
    outline:
      "border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/50",
  };

  const sizes = {
    sm: "px-3 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
