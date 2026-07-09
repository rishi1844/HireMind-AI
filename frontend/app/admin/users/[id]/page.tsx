"use client";

import { useEffect, useState } from "react";
import { AdminShell, GlassCard, SkeletonPulse } from "@/components/admin/AdminShell";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, FileText, MessageSquare, Cpu, Crown, Trash2, CheckCircle2, XCircle, X, Shield } from "lucide-react";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API = RAW_API.replace(/\/+$/, "").replace(/\/api$/, "");

async function adminFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...opts,
  });
  return res.json();
}

function PlanBadge({ plan }: { plan: string }) {
  const cfg: Record<string, { cls: string }> = {
    elite: { cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
    pro:   { cls: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
    free:  { cls: "border-white/10" },
  };
  const { cls } = cfg[plan] ?? cfg.free;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}
      style={plan === "free" ? { color: "var(--text-3)" } : {}}>
      {plan !== "free" && <Crown className="h-3 w-3" />}
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", backdropFilter: "blur(24px)" }}>
        {children}
      </div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const loadUser = () => {
    setLoading(true);
    adminFetch(`/api/admin/users/${params.id}`)
      .then(d => { setUser(d); setSelectedPlan(d.plan || "free"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUser(); }, [params.id]);

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/users/${params.id}`, { method: "DELETE" });
      if (res.message) { showToast("User deleted"); setTimeout(() => router.push("/admin/users"), 1200); }
    } finally { setActionLoading(false); setShowDelete(false); }
  };

  const handlePlanChange = async () => {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/users/${params.id}/plan`, { method: "PATCH", body: JSON.stringify({ plan: selectedPlan }) });
      if (res.user) { showToast(`Plan updated to ${selectedPlan}`); loadUser(); setShowPlan(false); }
    } finally { setActionLoading(false); }
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const totalTokens = user?.tokenUsage?.reduce((a: number, t: any) => a + (Number(t._sum?.totalTokens) || 0), 0) || 0;

  const PLANS = [
    { value: "free", label: "Free", desc: "₹0 / month" },
    { value: "pro", label: "Pro", desc: "₹499 / month" },
    { value: "elite", label: "Elite", desc: "₹999 / month" },
  ];

  if (loading) return (
    <AdminShell>
      <button onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-sm transition-opacity hover:opacity-70" style={{ color: "var(--text-3)" }}>
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <GlassCard className="mb-5 p-5">
        <div className="flex items-start gap-4">
          <SkeletonPulse className="h-14 w-14 flex-shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2"><SkeletonPulse className="h-5 w-40" /><SkeletonPulse className="h-3 w-56" /></div>
        </div>
      </GlassCard>
    </AdminShell>
  );

  if (!user || user.message) return (
    <AdminShell>
      <p className="py-20 text-center text-sm" style={{ color: "var(--text-3)" }}>User not found</p>
    </AdminShell>
  );

  return (
    <AdminShell>
      {toastMsg && (
        <div className="fixed right-4 top-4 z-[200] flex items-center gap-2 rounded-xl bg-emerald-600/90 px-4 py-3 text-sm font-medium text-white shadow-2xl" style={{ backdropFilter: "blur(12px)" }}>
          <CheckCircle2 className="h-4 w-4" />{toastMsg}
        </div>
      )}

      {showDelete && (
        <Modal onClose={() => setShowDelete(false)}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15"><Trash2 className="h-5 w-5 text-rose-400" /></div>
            <div><h3 className="font-bold" style={{ color: "var(--text-1)" }}>Delete User</h3><p className="text-xs" style={{ color: "var(--text-3)" }}>Cannot be undone</p></div>
            <button onClick={() => setShowDelete(false)} className="ml-auto" style={{ color: "var(--text-3)" }}><X className="h-5 w-5" /></button>
          </div>
          <p className="mb-5 rounded-xl p-3 text-sm" style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>
            Permanently delete <strong style={{ color: "var(--text-1)" }}>{user.name}</strong> and all associated data?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDelete(false)} className="flex-1 rounded-xl py-2.5 text-sm font-medium" style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-hover)" }}>Cancel</button>
            <button onClick={handleDelete} disabled={actionLoading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600/90 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
            </button>
          </div>
        </Modal>
      )}

      {showPlan && (
        <Modal onClose={() => setShowPlan(false)}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15"><Crown className="h-5 w-5 text-violet-400" /></div>
            <div><h3 className="font-bold" style={{ color: "var(--text-1)" }}>Change Plan</h3><p className="text-xs" style={{ color: "var(--text-3)" }}>Current: {user.plan || "free"}</p></div>
            <button onClick={() => setShowPlan(false)} className="ml-auto" style={{ color: "var(--text-3)" }}><X className="h-5 w-5" /></button>
          </div>
          <div className="mb-5 space-y-2">
            {PLANS.map(p => (
              <button key={p.value} onClick={() => setSelectedPlan(p.value)}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                style={{ border: selectedPlan === p.value ? "2px solid #8b5cf6" : "1px solid var(--border)", background: selectedPlan === p.value ? "var(--bg-active)" : "var(--bg-hover)" }}>
                <div className={`h-4 w-4 rounded-full border-2 transition-all ${selectedPlan === p.value ? "border-violet-400 bg-violet-400" : "border-slate-500"}`} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{p.label}</span>
                <span className="ml-auto text-xs" style={{ color: "var(--text-3)" }}>{p.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowPlan(false)} className="flex-1 rounded-xl py-2.5 text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-hover)" }}>Cancel</button>
            <button onClick={handlePlanChange} disabled={actionLoading || selectedPlan === user.plan}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600/90 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Update
            </button>
          </div>
        </Modal>
      )}

      <button onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-sm transition-opacity hover:opacity-70" style={{ color: "var(--text-3)" }}>
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </button>

      {/* User header */}
      <GlassCard className="mb-5 p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-violet-900/30">
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>{user.name}</h1>
              <PlanBadge plan={user.plan || "free"} />
              {user.emailVerified
                ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3" />Verified</span>
                : <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-3)" }}><XCircle className="h-3 w-3" />Unverified</span>}
            </div>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-3)" }}>{user.email}</p>
            {user.headline && <p className="mt-1 text-sm italic" style={{ color: "var(--text-2)" }}>{user.headline}</p>}
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <button onClick={() => setShowPlan(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:bg-violet-500/10 hover:text-violet-400"
              style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-hover)" }}>
              <Crown className="h-4 w-4" /> Change Plan
            </button>
            <button onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:bg-rose-500/10 hover:text-rose-400"
              style={{ border: "1px solid var(--border)", color: "var(--text-3)", background: "var(--bg-hover)" }}>
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Joined", val: fmtDate(user.createdAt), Icon: null },
            { label: "Resumes", val: user.resumes?.length || 0, Icon: FileText, color: "text-indigo-400" },
            { label: "Interviews", val: user.interviewSessions?.length || 0, Icon: MessageSquare, color: "text-emerald-400" },
            { label: "Tokens", val: totalTokens.toLocaleString(), Icon: Cpu, color: "text-amber-400" },
          ].map(({ label, val, Icon, color }: any) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--bg-hover)" }}>
              {Icon && <Icon className={`mx-auto mb-1 h-4 w-4 ${color}`} />}
              <p className="text-base font-bold" style={{ color: "var(--text-1)" }}>{val}</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>{label}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Recent Resumes</h2>
          {user.resumes?.length > 0 ? (
            <div className="space-y-2">
              {user.resumes.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "var(--bg-hover)" }}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--text-2)" }}>{r.fileName}</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>{fmtDate(r.uploadedAt)}</p>
                  </div>
                  {r.analysisResult?.atsScore != null && (
                    <span className="ml-3 flex-shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">ATS {r.analysisResult.atsScore}</span>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-sm" style={{ color: "var(--text-3)" }}>No resumes uploaded</p>}
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Interview Sessions</h2>
          {user.interviewSessions?.length > 0 ? (
            <div className="space-y-2">
              {user.interviewSessions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "var(--bg-hover)" }}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--text-2)" }}>{s.sessionTitle || `Session #${s.id}`}</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>{fmtDate(s.createdAt)}</p>
                  </div>
                  {s.overallScore != null && (
                    <span className="ml-3 flex-shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-bold text-violet-400">{s.overallScore}/10</span>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-sm" style={{ color: "var(--text-3)" }}>No interview sessions</p>}
        </GlassCard>

        {user.tokenUsage?.length > 0 && (
          <GlassCard className="p-5 lg:col-span-2">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Token Usage Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Feature", "Model", "Prompt", "Completion", "Total"].map(h => (
                    <th key={h} className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {user.tokenUsage.map((t: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td className="py-2 capitalize" style={{ color: "var(--text-2)" }}>{t.feature}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.model === "gpt" ? "bg-emerald-500/15 text-emerald-400" : "bg-violet-500/15 text-violet-400"}`}>
                          {t.model?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 tabular-nums" style={{ color: "var(--text-3)" }}>{Number(t._sum?.promptTokens || 0).toLocaleString()}</td>
                      <td className="py-2 tabular-nums" style={{ color: "var(--text-3)" }}>{Number(t._sum?.completionTokens || 0).toLocaleString()}</td>
                      <td className="py-2 tabular-nums font-semibold text-amber-400">{Number(t._sum?.totalTokens || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </AdminShell>
  );
}
