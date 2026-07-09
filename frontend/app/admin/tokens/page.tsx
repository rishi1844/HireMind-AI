"use client";

import { useEffect, useState } from "react";
import { AdminShell, GlassCard, SkeletonPulse } from "@/components/admin/AdminShell";
import { Loader2, RefreshCw, Cpu, Zap, TrendingUp, AlertCircle } from "lucide-react";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API = RAW_API.replace(/\/+$/, "").replace(/\/api$/, "");

async function adminFetch(path: string) {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="capitalize font-medium" style={{ color: "var(--text-2)" }}>{label}</span>
        <span className="tabular-nums" style={{ color: "var(--text-3)" }}>{value.toLocaleString()}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-hover)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const FEAT_COLORS: Record<string, string> = {
  analyze: "#06b6d4", interview: "#f43f5e", "cover-letter": "#6366f1",
  "job-match": "#f59e0b", builder: "#a78bfa",
};

export default function AdminTokensPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true); setError(false);
    try { setData(await adminFetch("/api/admin/token-usage")); }
    catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalTokens = data?.byModel?.reduce((a: number, b: any) => a + (b.totalTokens || 0), 0) || 0;
  const maxModel = data?.byModel?.reduce((m: number, b: any) => Math.max(m, b.totalTokens || 0), 0) || 0;
  const maxFeat = data?.byFeature?.reduce((m: number, b: any) => Math.max(m, b.totalTokens || 0), 0) || 0;

  const isEmpty = !loading && !error && data?.byModel?.length === 0 && data?.byFeature?.length === 0;

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Token Usage</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-3)" }}>
            {totalTokens > 0 ? `${totalTokens.toLocaleString()} total tokens consumed` : "Track AI API token consumption"}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{ border: "1px solid var(--border)", background: "var(--bg-card)", backdropFilter: "blur(20px)", color: "var(--text-2)" }}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <AlertCircle className="h-12 w-12 text-rose-400 opacity-70" />
          <p className="text-sm" style={{ color: "var(--text-2)" }}>Failed to load token data</p>
          <button onClick={load} className="rounded-xl bg-violet-600/80 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600 transition-colors">
            <RefreshCw className="mr-2 inline h-4 w-4" />Retry
          </button>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Cpu className="h-14 w-14 opacity-15" style={{ color: "var(--text-3)" }} />
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No token data yet. Use AI features to see usage here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Model summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? [1, 2, 3].map(i => (
                <GlassCard key={i} className="p-5">
                  <SkeletonPulse className="mb-4 h-6 w-20 rounded-full" />
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(j => <div key={j}><SkeletonPulse className="mx-auto mb-1 h-6 w-12" /><SkeletonPulse className="mx-auto h-2 w-10" /></div>)}
                  </div>
                </GlassCard>
              ))
              : data?.byModel?.map((m: any) => (
                <GlassCard key={m.model} className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${m.model === "gpt" ? "bg-emerald-500/15 text-emerald-400" : "bg-violet-500/15 text-violet-400"}`}>
                      {m.model === "gpt" ? "Vita AI" : "Vita AI"}
                    </span>
                    <Zap className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Calls", val: m.calls.toLocaleString() },
                      { label: "Prompt", val: `${(m.promptTokens / 1000).toFixed(1)}K` },
                      { label: "Total", val: `${(m.totalTokens / 1000).toFixed(1)}K`, amber: true },
                    ].map(({ label, val, amber }) => (
                      <div key={label}>
                        <p className={`text-lg font-bold ${amber ? "text-amber-400" : ""}`} style={!amber ? { color: "var(--text-1)" } : {}}>{val}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--bg-hover)" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${maxModel > 0 ? Math.round((m.totalTokens / maxModel) * 100) : 0}%`, background: m.model === "gpt" ? "#10b981" : "#8b5cf6" }} />
                  </div>
                </GlassCard>
              ))}

            {/* All Models total */}
            {!loading && data?.byModel?.length > 0 && (
              <GlassCard className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400">All Models</span>
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold" style={{ color: "var(--text-1)" }}>{data.byModel.reduce((a: number, b: any) => a + b.calls, 0).toLocaleString()}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>Calls</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: "var(--text-1)" }}>{((data.byModel.reduce((a: number, b: any) => a + b.promptTokens, 0)) / 1000).toFixed(1)}K</p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>Prompt</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-400">{(totalTokens / 1000).toFixed(1)}K</p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>Total</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--bg-hover)" }}>
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-500 to-amber-500" />
                </div>
              </GlassCard>
            )}
          </div>

          {/* Feature breakdown */}
          <GlassCard className="p-5">
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Usage by Feature</h2>
            {loading
              ? <div className="space-y-4">{[1, 2, 3].map(i => <div key={i}><SkeletonPulse className="mb-1.5 h-3 w-32" /><SkeletonPulse className="h-2 w-full" /></div>)}</div>
              : <div className="space-y-4">
                {data?.byFeature?.map((f: any) => (
                  <Bar key={f.feature} label={`${f.feature} · ${f.calls} calls`}
                    value={f.totalTokens} max={maxFeat}
                    color={FEAT_COLORS[f.feature] ?? "#a78bfa"} />
                ))}
              </div>}
          </GlassCard>

          {/* Daily table */}
          {!loading && data?.daily?.length > 0 && (
            <GlassCard className="p-5">
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Last 7 Days</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Date", "Model", "Tokens"].map(h => (
                      <th key={h} className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {data.daily.map((row: any, i: number) => (
                      <tr key={i} className="transition-colors duration-150" style={{ borderBottom: "1px solid var(--border)" }}
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
            </GlassCard>
          )}
        </div>
      )}
    </AdminShell>
  );
}
