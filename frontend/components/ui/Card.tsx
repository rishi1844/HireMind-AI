import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "violet" | "cyan" | "emerald" | "none";
  hover?: boolean;
}

export function Card({ className, glow = "none", hover = false, children, ...props }: CardProps) {
  const glowMap = {
    violet: "border-violet-500/20 shadow-violet-500/10",
    cyan: "border-cyan-500/20 shadow-cyan-500/10",
    emerald: "border-emerald-500/20 shadow-emerald-500/10",
    none: "border-white/6",
  };

  return (
    <div
      className={cn(
        "glass-card rounded-2xl border shadow-lg",
        glowMap[glow],
        hover && "hover:border-violet-500/30 hover:scale-[1.01] transition-all cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pb-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display font-semibold text-white text-lg leading-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-slate-400 text-sm mt-1", className)} {...props}>
      {children}
    </p>
  );
}
