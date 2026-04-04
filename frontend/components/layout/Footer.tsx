"use client";

import { Github, Globe, Linkedin } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

const footerLinks = [
  { href: "https://github.com/rishi1844", label: "GitHub", icon: Github },
  { href: "https://www.linkedin.com/in/rishikant-singh-53287728a/", label: "LinkedIn", icon: Linkedin },
  { href: "https://rishikantportfolio.netlify.app/", label: "Portfolio", icon: Globe },
];

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("border-t border-white/6 bg-slate-950/60 px-4 py-4 backdrop-blur-xl", className)}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-4">
        <p className="text-sm text-slate-400">
          Created by <span className="font-medium text-slate-200">{BRAND.creator}</span>
        </p>
        <div className="hidden h-4 w-px bg-white/10 sm:block" />
        <div className="flex items-center gap-2">
          {footerLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-slate-300 transition-all duration-200 hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
