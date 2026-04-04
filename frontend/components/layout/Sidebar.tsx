"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain,
  History,
  LayoutDashboard,
  LogOut,
  Mic,
  NotebookText,
  Upload,
  UserCircle2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { BRAND } from "@/lib/brand";
import { useAuthStore } from "@/lib/store";
import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume/upload", label: "Upload Resume", icon: Upload },
  { href: "/interview", label: "Interview", icon: Mic },
  { href: "/interview/history", label: "Interview History", icon: NotebookText },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/");
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/8 bg-slate-950/90 backdrop-blur-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/6 px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/10">
              <Image src="/logo.png" alt={`${BRAND.name} logo`} width={40} height={40} className="h-10 w-10 object-cover" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white brand-wordmark text-[1.45rem]">{BRAND.name}</p>
              <p className="text-xs text-slate-500">Career intelligence, refined</p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  active
                    ? "border border-violet-500/25 bg-gradient-to-r from-violet-600/20 to-cyan-600/10 text-white shadow-lg shadow-violet-500/5"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    active ? "text-violet-300" : "text-slate-500 group-hover:text-slate-200"
                  )}
                />
                <span>{item.label}</span>
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/6 p-4">

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
