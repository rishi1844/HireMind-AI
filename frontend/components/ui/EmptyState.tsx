import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="glass-card rounded-2xl p-12 text-center border border-dashed border-white/10">
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-violet-400" />
      </div>
      <h3 className="text-xl font-display font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     bg-gradient-to-r from-violet-600 to-cyan-600 text-white
                     font-medium text-sm hover:from-violet-500 hover:to-cyan-500 transition-all"
        >
          {action.label} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
