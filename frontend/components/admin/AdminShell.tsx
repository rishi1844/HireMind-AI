"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, Cpu, LogOut, Shield,
  ChevronRight, Menu, X, Sun, Moon, Activity, Sparkles
} from "lucide-react";

// ─── Theme Context ─────────────────────────────────────────────────────────────
type Theme = "dark" | "light";
interface ThemeCtx { theme: Theme; toggle: () => void; }
const ThemeContext = createContext<ThemeCtx>({ theme: "dark", toggle: () => { } });
export const useAdminTheme = () => useContext(ThemeContext);

interface AdminUser { email: string; }

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/tokens", label: "Token Usage", icon: Cpu },
];

// ─── CSS vars per theme ────────────────────────────────────────────────────────
const DARK_VARS: Record<string, string> = {
  "--bg-page": "linear-gradient(135deg, #0a0e1a 0%, #0d1230 35%, #130a2e 65%, #0a0a14 100%)",
  "--bg-card": "rgba(255,255,255,0.04)",
  "--bg-card-hover": "rgba(255,255,255,0.07)",
  "--bg-sidebar": "rgba(10,14,26,0.92)",
  "--bg-topbar": "rgba(10,14,26,0.85)",
  "--bg-input": "rgba(255,255,255,0.05)",
  "--bg-hover": "rgba(255,255,255,0.05)",
  "--bg-active": "rgba(139,92,246,0.18)",
  "--border": "rgba(255,255,255,0.08)",
  "--border-hover": "rgba(139,92,246,0.45)",
  "--glow-1": "rgba(99,102,241,0.12)",
  "--glow-2": "rgba(139,92,246,0.08)",
  "--text-1": "#f0f4ff",
  "--text-2": "#a8b8d8",
  "--text-3": "#5a6a8a",
  "--text-active": "#c4b5fd",
  "--shadow-card": "0 8px 32px rgba(0,0,0,0.4)",
  "--shadow-hover": "0 16px 48px rgba(99,102,241,0.2)",
};

const LIGHT_VARS: Record<string, string> = {
  "--bg-page": "linear-gradient(135deg, #e8eeff 0%, #f0e8ff 35%, #e8f4ff 65%, #f8f0ff 100%)",
  "--bg-card": "rgba(255,255,255,0.72)",
  "--bg-card-hover": "rgba(255,255,255,0.90)",
  "--bg-sidebar": "rgba(255,255,255,0.88)",
  "--bg-topbar": "rgba(240,244,255,0.88)",
  "--bg-input": "rgba(255,255,255,0.80)",
  "--bg-hover": "rgba(109,40,217,0.06)",
  "--bg-active": "rgba(109,40,217,0.10)",
  "--border": "rgba(109,40,217,0.12)",
  "--border-hover": "rgba(109,40,217,0.40)",
  "--glow-1": "rgba(109,40,217,0.08)",
  "--glow-2": "rgba(99,102,241,0.06)",
  "--text-1": "#0f172a",
  "--text-2": "#334155",
  "--text-3": "#64748b",
  "--text-active": "#5b21b6",
  "--shadow-card": "0 4px 24px rgba(99,102,241,0.08)",
  "--shadow-hover": "0 12px 40px rgba(99,102,241,0.18)",
};

function applyVars(vars: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

// ─── Cinematic Theme Transition Overlay ───────────────────────────────────────
function ThemeTransitionOverlay({ active, origin, onDone }: {
  active: boolean; origin: { x: number; y: number }; onDone: () => void;
}) {
  useEffect(() => {
    if (active) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
  }, [active, onDone]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      style={{ mixBlendMode: "screen" }}
    >
      {/* Radial burst */}
      <div
        style={{
          position: "absolute",
          left: origin.x,
          top: origin.y,
          width: 0,
          height: 0,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(180,160,255,0.6) 0%, rgba(99,102,241,0.3) 40%, transparent 70%)",
          transform: "translate(-50%,-50%)",
          animation: "burst 0.65s cubic-bezier(0.22,1,0.36,1) forwards",
        }}
      />
      {/* Sun rays */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: origin.x,
            top: origin.y,
            width: 2,
            height: 0,
            background: "linear-gradient(to top, transparent, rgba(180,160,255,0.7))",
            transformOrigin: "bottom center",
            transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
            animation: "ray 0.65s cubic-bezier(0.22,1,0.36,1) forwards",
            animationDelay: `${i * 20}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes burst {
          0%   { width:0; height:0; opacity:1 }
          100% { width:250vmax; height:250vmax; opacity:0 }
        }
        @keyframes ray {
          0%   { height:0; opacity:0.8 }
          100% { height:40vmax; opacity:0 }
        }
      `}</style>
    </div>
  );
}

// ─── Theme Toggle Button ───────────────────────────────────────────────────────
function ThemeToggle({ theme, toggle }: { theme: Theme; toggle: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300"
      style={{
        border: "1px solid var(--border)",
        background: "var(--bg-hover)",
        color: theme === "dark" ? "#a78bfa" : "#6d28d9",
        boxShadow: "0 0 12px rgba(139,92,246,0.15)",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(139,92,246,0.35)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(139,92,246,0.15)"}
    >
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-500"
        style={{ opacity: theme === "dark" ? 1 : 0, transform: theme === "dark" ? "scale(1) rotate(0deg)" : "scale(0) rotate(90deg)" }}
      >
        <Moon className="h-4 w-4" />
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-500"
        style={{ opacity: theme === "light" ? 1 : 0, transform: theme === "light" ? "scale(1) rotate(0deg)" : "scale(0) rotate(-90deg)" }}
      >
        <Sun className="h-4 w-4" />
      </span>
    </button>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: "var(--bg-hover)" }}
    />
  );
}

export { SkeletonPulse };

// ─── Glass Card wrapper ─────────────────────────────────────────────────────
export function GlassCard({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "var(--shadow-card)",
        ...style,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "var(--bg-card-hover)";
        el.style.borderColor = "var(--border-hover)";
        el.style.boxShadow = "var(--shadow-hover)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "var(--bg-card)";
        el.style.borderColor = "var(--border)";
        el.style.boxShadow = "var(--shadow-card)";
        el.style.transform = "translateY(0)";
      }}
    >
      {children}
    </div>
  );
}

// ─── Main AdminShell ───────────────────────────────────────────────────────────
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [transitioning, setTransitioning] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const stored = localStorage.getItem("adminTheme") as Theme | null;
    const t = (stored === "light" || stored === "dark") ? stored : "dark";
    setTheme(t);
    applyVars(t === "dark" ? DARK_VARS : LIGHT_VARS);
  }, []);

  useEffect(() => {
    applyVars(theme === "dark" ? DARK_VARS : LIGHT_VARS);
  }, [theme]);

  const toggleTheme = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setTransitioning(true);
    setTimeout(() => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      setTheme(next);
      localStorage.setItem("adminTheme", next);
    }, 100);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const email = localStorage.getItem("adminEmail");
    if (!token || !email) { router.replace("/admin/login"); return; }
    setAdmin({ email });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    router.replace("/admin/login");
  };

  if (!admin) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg-page, #0a0e1a)", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-900/50">
          <Shield className="h-7 w-7 text-white" />
        </div>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
      </div>
    </div>
  );

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => { } }}>
      <ThemeTransitionOverlay active={transitioning} origin={origin} onDone={() => setTransitioning(false)} />

      {/* Page wrapper with gradient bg */}
      <div className="min-h-screen" style={{ background: "var(--bg-page)", fontFamily: "'Inter',system-ui,sans-serif" }}>
        {/* Ambient glow corners */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full blur-[120px]" style={{ background: "var(--glow-1)" }} />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full blur-[120px]" style={{ background: "var(--glow-2)" }} />
          <div className="absolute top-1/2 left-1/3 h-64 w-64 -translate-y-1/2 rounded-full blur-[100px]" style={{ background: "var(--glow-1)", opacity: 0.5 }} />
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 lg:translate-x-0"
          style={{
            background: "var(--bg-sidebar)",
            borderRight: "1px solid var(--border)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            transform: sidebarOpen ? "translateX(0)" : undefined,
          }}
        >
          <style>{`@media(max-width:1023px){aside{transform:${sidebarOpen ? "translateX(0)" : "translateX(-100%)"}}}`}</style>

          {/* Mobile close */}
          <button onClick={() => setSidebarOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 transition-colors hover:text-white lg:hidden" style={{ color: "var(--text-3)" }}>
            <X className="h-4 w-4" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/40">
              <Shield className="h-5 w-5 text-white" />
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-violet-500" />
              </span>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>Vita AI</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#8b5cf6" }}>Admin Console</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 px-3 py-5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
                  style={{
                    background: active ? "var(--bg-active)" : "transparent",
                    color: active ? "var(--text-active)" : "var(--text-2)",
                    borderLeft: active ? "2px solid #8b5cf6" : "2px solid transparent",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                  {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
                </Link>
              );
            })}
          </nav>

          {/* Live pill */}
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--bg-hover)" }}>
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs" style={{ color: "var(--text-3)" }}>System Live</span>
              <span className="relative ml-auto flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
            </div>
          </div>

          {/* Admin + logout */}
          <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: "var(--bg-hover)" }}>
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white">
                {admin.email[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Admin</p>
                <p className="truncate text-xs font-medium" style={{ color: "var(--text-2)" }}>{admin.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-400"
              style={{ color: "var(--text-3)" }}>
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="relative z-10 lg:pl-64">
          {/* Topbar */}
          <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-2xl lg:px-8"
            style={{ background: "var(--bg-topbar)", borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center rounded-xl p-2 transition-all lg:hidden"
              style={{ border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-2)" }}>
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex flex-1 items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: "#8b5cf6" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                {NAV_ITEMS.find(n => n.href === pathname)?.label ?? "Admin"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-1.5 sm:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs" style={{ color: "var(--text-3)" }}>Live</span>
              </div>
              <ThemeToggle theme={theme} toggle={toggleTheme} />
            </div>
          </div>

          <main className="px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
