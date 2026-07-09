"use client";

import { useEffect, useState, useRef } from "react";
import { AdminShell, useAdminTheme, GlassCard, SkeletonPulse } from "@/components/admin/AdminShell";
import {
  Users, FileText, MessageSquare, Cpu, TrendingUp,
  RefreshCw, Loader2, Crown, UserCheck, IndianRupee, Zap, AlertCircle
} from "lucide-react";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API = RAW_API.replace(/\/+$/, "").replace(/\/api$/, "");

interface Stats {
  totalUsers: number; totalResumes: number; totalAnalyses: number;
  totalInterviews: number; totalBuiltResumes: number; totalTokensUsed: number;
  premiumUsers: number; freeUsers: number; monthlyRevenue: number;
  planBreakdown: Record<string, number>;
  signupTrend: { date: string; count: number }[];
}
interface TokenData {
  byModel: { model: string; totalTokens: number; calls: number; promptTokens?: number }[];
  byFeature: { feature: string; totalTokens: number; calls: number }[];
  daily: { date: string; model: string; tokens: number }[];
}

async function adminFetch(path: string) {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(ease * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return val;
}

// ── Card theme config per card ────────────────────────────────────────────────
interface CardTheme {
  accent: string;           // top border + icon bg color
  hoverBg: string;          // glass tint on hover
  hoverBorder: string;      // glow border color on hover
  hoverShadow: string;      // drop shadow on hover
  iconGrad: string;         // icon gradient (CSS)
}

// ── Stat card — unique glassmorphism per card ─────────────────────────────────
function StatCard({
  label, rawValue, sub, icon: Icon, prefix = "", loading, cardTheme,
}: {
  label: string; rawValue: number; sub: string;
  icon: React.ElementType; prefix?: string; loading: boolean;
  cardTheme: CardTheme;
}) {
  const n = useCountUp(rawValue);
  const display = prefix === "₹"
    ? `₹${n.toLocaleString("en-IN")}`
    : rawValue > 9999 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString();

  if (loading) return (
    <div className="rounded-2xl p-5"
      style={{
        background: "var(--bg-card)",
        borderTop: `2px solid ${cardTheme.accent}`,
        borderRight: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        borderLeft: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
      }}>
      <SkeletonPulse className="mb-4 h-3 w-24" />
      <SkeletonPulse className="mb-2 h-8 w-16" />
      <SkeletonPulse className="h-3 w-20" />
    </div>
  );

  return (
    <div
      className="group relative cursor-default rounded-2xl p-5 transition-all duration-300"
      style={{
        background: "var(--bg-card)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        /* top accent border — part of border shorthand to avoid overflow clipping */
        borderTop: `2px solid ${cardTheme.accent}`,
        borderRight: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        borderLeft: "1px solid var(--border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.background = cardTheme.hoverBg;
        el.style.borderRight = `1px solid ${cardTheme.hoverBorder}`;
        el.style.borderBottom = `1px solid ${cardTheme.hoverBorder}`;
        el.style.borderLeft = `1px solid ${cardTheme.hoverBorder}`;
        el.style.borderTop = `2px solid ${cardTheme.accent}`;
        el.style.boxShadow = cardTheme.hoverShadow;
        el.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.background = "var(--bg-card)";
        el.style.borderTop = `2px solid ${cardTheme.accent}`;
        el.style.borderRight = "1px solid var(--border)";
        el.style.borderBottom = "1px solid var(--border)";
        el.style.borderLeft = "1px solid var(--border)";
        el.style.boxShadow = "0 4px 24px rgba(0,0,0,0.25)";
        el.style.transform = "translateY(0)";
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>{label}</p>
          <p className="mt-2 text-[2rem] font-bold leading-none tracking-tight" style={{ color: "var(--text-1)" }}>{display}</p>
          <p className="mt-1.5 text-xs" style={{ color: "var(--text-3)" }}>{sub}</p>
        </div>
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-lg"
          style={{ background: cardTheme.iconGrad }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <GlassCard className={`p-5 ${className}`}>
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>{title}</h2>
      {children}
    </GlassCard>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ premium, free }: { premium: number; free: number }) {
  const { theme } = useAdminTheme();
  const total = premium + free || 1;
  const pct = (premium / total) * 100;
  const r = 42; const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none"
            stroke={theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth="10" />
          <circle cx="50" cy="50" r={r} fill="none"
            stroke="url(#dg)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${filled} ${circ - filled}`}
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
          <defs>
            <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold" style={{ color: "var(--text-1)" }}>{pct.toFixed(0)}%</span>
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>Premium</span>
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        {[{ label: "Premium", count: premium, color: "#8b5cf6" }, { label: "Free", count: free, color: "var(--text-3)" }].map(({ label, count, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span style={{ color: "var(--text-2)" }}>{label} ({count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar ───────────────────────────────────────────────────────────────────────
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="max-w-[60%] truncate capitalize" style={{ color: "var(--text-2)" }}>{label}</span>
        <span className="tabular-nums" style={{ color: "var(--text-3)" }}>{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-hover)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  const { theme } = useAdminTheme();
  if (!data || data.length < 2) return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <AlertCircle className="h-8 w-8 opacity-20" style={{ color: "var(--text-3)" }} />
      <p className="text-sm" style={{ color: "var(--text-3)" }}>No signup data this week</p>
    </div>
  );
  const W = 300; const H = 80; const P = 10;
  const maxV = Math.max(...data.map(d => Number(d.count)), 1);
  const coords = data.map((d, i) => ({
    x: P + (i / (data.length - 1)) * (W - P * 2),
    y: H - P - (Number(d.count) / maxV) * (H - P * 2),
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x},${c.y}`).join(" ");
  const area = `${line} L ${W - P},${H - P} L ${P},${H - P} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 90 }}>
        <defs>
          <linearGradient id="sf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sf)" />
        <path d={line} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#8b5cf6"
            stroke={theme === "dark" ? "#0a0e1a" : "#fff"} strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between">
        {data.map((d, i) => (
          <span key={i} className="text-[9px]" style={{ color: "var(--text-3)" }}>{String(d.date).slice(5, 10)}</span>
        ))}
      </div>
    </div>
  );
}

// ── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <AlertCircle className="h-12 w-12 text-rose-400 opacity-70" />
      <p className="text-sm" style={{ color: "var(--text-2)" }}>Failed to load dashboard data</p>
      <button onClick={onRetry} className="flex items-center gap-2 rounded-xl bg-violet-600/80 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600 transition-colors">
        <RefreshCw className="h-4 w-4" /> Retry
      </button>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true); setError(false);
    try {
      const [s, t] = await Promise.all([
        adminFetch("/api/admin/stats"),
        adminFetch("/api/admin/token-usage"),
      ]);
      setStats(s); setTokens(t);
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const maxModel = tokens?.byModel?.reduce((m, b) => Math.max(m, b.totalTokens), 0) ?? 0;
  const maxFeat = tokens?.byFeature?.reduce((m, b) => Math.max(m, b.totalTokens), 0) ?? 0;

  const MODEL_COLORS: Record<string, string> = { gpt: "#10b981", gemini: "#8b5cf6" };
  const FEAT_COLORS: Record<string, string> = {
    analyze: "#06b6d4", interview: "#f43f5e", "cover-letter": "#6366f1",
    "job-match": "#f59e0b", builder: "#a78bfa",
  };

  return (
    <AdminShell>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Dashboard</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-3)" }}>Platform analytics · revenue · AI usage</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{ border: "1px solid var(--border)", background: "var(--bg-card)", backdropFilter: "blur(20px)", color: "var(--text-2)" }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error ? <ErrorState onRetry={load} /> : (
        <div className="space-y-5">
          {/* Row 1 — 4 primary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Total Users — Violet */}
            <StatCard label="Total Users" rawValue={stats?.totalUsers ?? 0} sub="Registered accounts" icon={Users} loading={loading}
              cardTheme={{
                accent: "#8b5cf6",
                hoverBg: "rgba(139,92,246,0.10)",
                hoverBorder: "rgba(139,92,246,0.50)",
                hoverShadow: "0 16px 40px rgba(139,92,246,0.22)",
                iconGrad: "linear-gradient(135deg,#7c3aed,#6366f1)",
              }} />
            {/* Premium Users — Amber */}
            <StatCard label="Premium Users" rawValue={stats?.premiumUsers ?? 0} sub="Pro + Elite plans" icon={Crown} loading={loading}
              cardTheme={{
                accent: "#f59e0b",
                hoverBg: "rgba(245,158,11,0.10)",
                hoverBorder: "rgba(245,158,11,0.50)",
                hoverShadow: "0 16px 40px rgba(245,158,11,0.22)",
                iconGrad: "linear-gradient(135deg,#d97706,#f59e0b)",
              }} />
            {/* Free Users — Slate/Blue */}
            <StatCard label="Free Users" rawValue={stats?.freeUsers ?? 0} sub="On free plan" icon={UserCheck} loading={loading}
              cardTheme={{
                accent: "#64748b",
                hoverBg: "rgba(100,116,139,0.10)",
                hoverBorder: "rgba(100,116,139,0.50)",
                hoverShadow: "0 16px 40px rgba(100,116,139,0.22)",
                iconGrad: "linear-gradient(135deg,#475569,#64748b)",
              }} />
            {/* Revenue — Emerald */}
            <StatCard label="Monthly Revenue" rawValue={stats?.monthlyRevenue ?? 0} sub="Estimated MRR" icon={IndianRupee} prefix="₹" loading={loading}
              cardTheme={{
                accent: "#10b981",
                hoverBg: "rgba(16,185,129,0.10)",
                hoverBorder: "rgba(16,185,129,0.50)",
                hoverShadow: "0 16px 40px rgba(16,185,129,0.22)",
                iconGrad: "linear-gradient(135deg,#059669,#10b981)",
              }} />
          </div>

          {/* Row 2 — 4 secondary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Resumes — Indigo */}
            <StatCard label="Resumes" rawValue={stats?.totalResumes ?? 0} sub="All uploads" icon={FileText} loading={loading}
              cardTheme={{
                accent: "#6366f1",
                hoverBg: "rgba(99,102,241,0.10)",
                hoverBorder: "rgba(99,102,241,0.50)",
                hoverShadow: "0 16px 40px rgba(99,102,241,0.22)",
                iconGrad: "linear-gradient(135deg,#4f46e5,#6366f1)",
              }} />
            {/* AI Analyses — Cyan */}
            <StatCard label="AI Analyses" rawValue={stats?.totalAnalyses ?? 0} sub="Reviews done" icon={TrendingUp} loading={loading}
              cardTheme={{
                accent: "#06b6d4",
                hoverBg: "rgba(6,182,212,0.10)",
                hoverBorder: "rgba(6,182,212,0.50)",
                hoverShadow: "0 16px 40px rgba(6,182,212,0.22)",
                iconGrad: "linear-gradient(135deg,#0891b2,#06b6d4)",
              }} />
            {/* Interviews — Rose */}
            <StatCard label="Interviews" rawValue={stats?.totalInterviews ?? 0} sub="Mock sessions" icon={MessageSquare} loading={loading}
              cardTheme={{
                accent: "#f43f5e",
                hoverBg: "rgba(244,63,94,0.10)",
                hoverBorder: "rgba(244,63,94,0.50)",
                hoverShadow: "0 16px 40px rgba(244,63,94,0.22)",
                iconGrad: "linear-gradient(135deg,#e11d48,#f43f5e)",
              }} />
            {/* Tokens — Orange-Yellow */}
            <StatCard label="Tokens Used" rawValue={stats?.totalTokensUsed ?? 0} sub="AI tokens total" icon={Zap} loading={loading}
              cardTheme={{
                accent: "#f97316",
                hoverBg: "rgba(249,115,22,0.10)",
                hoverBorder: "rgba(249,115,22,0.50)",
                hoverShadow: "0 16px 40px rgba(249,115,22,0.22)",
                iconGrad: "linear-gradient(135deg,#ea580c,#f97316)",
              }} />
          </div>

          {/* Row 3 — Donut + Sparkline */}
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard title="User Distribution">
              {loading ? (
                <div className="flex flex-col items-center gap-3"><SkeletonPulse className="h-28 w-28 rounded-full" /><SkeletonPulse className="h-3 w-32" /></div>
              ) : (
                <>
                  <DonutChart premium={stats?.premiumUsers ?? 0} free={stats?.freeUsers ?? 0} />
                  <div className="mt-4 space-y-2">
                    {[
                      { label: "Free", count: stats?.planBreakdown?.free ?? 0, price: 0, color: "var(--text-3)" },
                      { label: "Pro", count: stats?.planBreakdown?.pro ?? 0, price: 199, color: "#8b5cf6" },
                      { label: "Elite", count: stats?.planBreakdown?.elite ?? 0, price: 399, color: "#f59e0b" },
                    ].map(({ label, count, price, color }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                          <span style={{ color: "var(--text-2)" }}>{label} ({count})</span>
                        </div>
                        <span className="font-semibold" style={{ color: "var(--text-1)" }}>
                          {price > 0 ? `₹${(count * price).toLocaleString("en-IN")}` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </SectionCard>

            <SectionCard title="New Signups — Last 7 Days" className="lg:col-span-2">
              {loading
                ? <><SkeletonPulse className="h-20 w-full rounded-xl" /><SkeletonPulse className="mt-2 h-3 w-full" /></>
                : <Sparkline data={stats?.signupTrend ?? []} />}
            </SectionCard>
          </div>

          {/* Row 3.5 — Device & Platform Analytics */}
          <div className="space-y-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Device &amp; Platform Analytics</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Desktop Users" rawValue={stats?.deviceStats?.devices?.desktop ?? 0} sub="Desktop & Laptop visits" icon={Zap} loading={loading}
                cardTheme={{
                  accent: "#8b5cf6",
                  hoverBg: "rgba(139,92,246,0.10)",
                  hoverBorder: "rgba(139,92,246,0.50)",
                  hoverShadow: "0 16px 40px rgba(139,92,246,0.22)",
                  iconGrad: "linear-gradient(135deg,#7c3aed,#6366f1)",
                }} />
              <StatCard label="Mobile Users" rawValue={stats?.deviceStats?.devices?.mobile ?? 0} sub="Phone visits" icon={TrendingUp} loading={loading}
                cardTheme={{
                  accent: "#06b6d4",
                  hoverBg: "rgba(6,182,212,0.10)",
                  hoverBorder: "rgba(6,182,212,0.50)",
                  hoverShadow: "0 16px 40px rgba(6,182,212,0.22)",
                  iconGrad: "linear-gradient(135deg,#0891b2,#06b6d4)",
                }} />
              <StatCard label="Tablet Users" rawValue={stats?.deviceStats?.devices?.tablet ?? 0} sub="Tablet visits" icon={Crown} loading={loading}
                cardTheme={{
                  accent: "#f43f5e",
                  hoverBg: "rgba(244,63,94,0.10)",
                  hoverBorder: "rgba(244,63,94,0.50)",
                  hoverShadow: "0 16px 40px rgba(244,63,94,0.22)",
                  iconGrad: "linear-gradient(135deg,#e11d48,#f43f5e)",
                }} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="OS Distribution">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i}><SkeletonPulse className="mb-1.5 h-3 w-28" /><SkeletonPulse className="h-2 w-full" /></div>)}
                  </div>
                ) : stats?.deviceStats?.os && Object.keys(stats.deviceStats.os).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.deviceStats.os).map(([osName, count]) => {
                      const maxOS = Object.values(stats.deviceStats.os).reduce((a, b) => Math.max(a, Number(b)), 1);
                      return (
                        <Bar key={osName} label={osName} value={Number(count)} max={maxOS} color="#06b6d4" />
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm" style={{ color: "var(--text-3)" }}>No OS analytics data yet</p>
                )}
              </SectionCard>

              <SectionCard title="Browser Distribution">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i}><SkeletonPulse className="mb-1.5 h-3 w-28" /><SkeletonPulse className="h-2 w-full" /></div>)}
                  </div>
                ) : stats?.deviceStats?.browsers && Object.keys(stats.deviceStats.browsers).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.deviceStats.browsers).map(([browserName, count]) => {
                      const maxBrowser = Object.values(stats.deviceStats.browsers).reduce((a, b) => Math.max(a, Number(b)), 1);
                      return (
                        <Bar key={browserName} label={browserName} value={Number(count)} max={maxBrowser} color="#f59e0b" />
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm" style={{ color: "var(--text-3)" }}>No browser analytics data yet</p>
                )}
              </SectionCard>
            </div>
          </div>

          {/* Row 4 — Token charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Tokens by Model">
              {loading
                ? <div className="space-y-4">{[1, 2].map(i => <div key={i}><SkeletonPulse className="mb-1.5 h-3 w-32" /><SkeletonPulse className="h-2 w-full" /></div>)}</div>
                : tokens?.byModel?.length
                  ? <div className="space-y-4">{tokens.byModel.map(m => (
                    <Bar key={m.model} label={`${m.model === "gpt" ? "Vita AI" : "Vita AI"} · ${m.calls} calls`}
                      value={m.totalTokens} max={maxModel}
                      color={MODEL_COLORS[m.model] ?? "#8b5cf6"} />
                  ))}</div>
                  : <p className="py-6 text-center text-sm" style={{ color: "var(--text-3)" }}>No token data yet</p>}
            </SectionCard>

            <SectionCard title="Tokens by Feature">
              {loading
                ? <div className="space-y-4">{[1, 2, 3].map(i => <div key={i}><SkeletonPulse className="mb-1.5 h-3 w-28" /><SkeletonPulse className="h-2 w-full" /></div>)}</div>
                : tokens?.byFeature?.length
                  ? <div className="space-y-4">{tokens.byFeature.map(f => (
                    <Bar key={f.feature} label={`${f.feature} · ${f.calls} calls`}
                      value={f.totalTokens} max={maxFeat}
                      color={FEAT_COLORS[f.feature] ?? "#a78bfa"} />
                  ))}</div>
                  : <p className="py-6 text-center text-sm" style={{ color: "var(--text-3)" }}>No token data yet</p>}
            </SectionCard>
          </div>

          {/* Row 5 — Daily table */}
          {!loading && tokens?.daily && tokens.daily.length > 0 && (
            <SectionCard title="Last 7 Days — Daily Token Usage">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Date", "Model", "Tokens"].map(h => (
                      <th key={h} className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {tokens.daily.map((row, i) => (
                      <tr key={i} className="transition-colors duration-150 cursor-default" style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <td className="py-2.5" style={{ color: "var(--text-2)" }}>{String(row.date).substring(0, 10)}</td>
                        <td className="py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${String(row.model) === "gpt" ? "bg-emerald-500/15 text-emerald-400" : "bg-violet-500/15 text-violet-400"}`}>
                            {String(row.model).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 tabular-nums font-semibold text-amber-400">{Number(row.tokens).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </AdminShell>
  );
}
