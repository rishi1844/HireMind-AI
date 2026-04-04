import { cn } from "@/lib/utils";

type Color = "violet" | "cyan" | "emerald" | "rose" | "amber" | "slate";

interface BadgeProps {
  children: React.ReactNode;
  color?: Color;
  className?: string;
}

const colorMap: Record<Color, string> = {
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  slate: "bg-white/5 text-slate-400 border-white/10",
};

export function Badge({ children, color = "slate", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        colorMap[color],
        className
      )}
    >
      {children}
    </span>
  );
}
