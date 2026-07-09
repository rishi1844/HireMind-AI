"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { BrandWordmark } from "@/components/ui/BrandWordmark";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "relative overflow-hidden border-t border-white/[0.07]",
        className
      )}
      style={{
        background:
          "linear-gradient(180deg, rgba(2,6,23,0.0) 0%, rgba(2,6,23,0.85) 100%), rgba(8,12,32,0.92)",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Top glow line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <div className="h-px w-[60%] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      </div>

      {/* Subtle ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[80px] w-[240px] -translate-y-1/2 rounded-full bg-violet-600/10 blur-[48px]" />
        <div className="absolute right-1/4 top-0 h-[80px] w-[240px] -translate-y-1/2 rounded-full bg-cyan-500/8 blur-[48px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* Logo + Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-xl"
          >
            {/* Logo — same glow style as Navbar */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-[3px] rounded-2xl bg-gradient-to-br from-violet-500/40 via-indigo-500/20 to-cyan-500/30 blur-[7px] opacity-70 group-hover:opacity-100 group-hover:blur-[10px] transition-all duration-300" />
              <div className="relative rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-[3px] ring-1 ring-white/[0.12] shadow-[0_2px_12px_rgba(109,40,217,0.35),0_1px_3px_rgba(0,0,0,0.6)] group-hover:ring-violet-400/40 group-hover:shadow-[0_4px_20px_rgba(109,40,217,0.5),0_1px_4px_rgba(0,0,0,0.7)] transition-all duration-300">
                <Image
                  src="/logo.png"
                  alt={`${BRAND.name} logo`}
                  width={32}
                  height={32}
                  className="h-7 w-7 sm:h-8 sm:w-8 object-contain rounded-lg"
                />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <BrandWordmark className="text-[1.05rem] sm:text-[1.15rem]" />
              <span className="text-[9px] text-slate-500 tracking-wide mt-0.5 hidden sm:block">
                AI Resume &amp; Interview Platform
              </span>
            </div>
          </Link>

          {/* Center: copyright */}
          <p className="text-xs text-slate-600 order-last sm:order-none text-center">
            © {year}{" "}
            <span className="text-slate-500">{BRAND.name}</span>
            {" "}· All rights reserved
          </p>

          {/* Right: Legal links */}
          <nav className="flex items-center gap-1" aria-label="Legal">
            <Link
              href="/privacy"
              className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-all duration-200 hover:bg-white/6 hover:text-violet-300"
            >
              Privacy Policy
            </Link>
            <div className="h-3 w-px bg-white/15" />
            <Link
              href="/terms"
              className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-all duration-200 hover:bg-white/6 hover:text-violet-300"
            >
              Terms & Conditions
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
