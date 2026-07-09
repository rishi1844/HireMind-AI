"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminShell, GlassCard, SkeletonPulse } from "@/components/admin/AdminShell";
import { useRouter } from "next/navigation";
import {
  Search, Loader2, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Crown, Trash2, Shield, X, AlertCircle, Users
} from "lucide-react";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API = RAW_API.replace(/\/+$/, "").replace(/\/api$/, "");

interface UserRow {
  id: string; name: string; email: string; createdAt: string | null;
  emailVerified: boolean; plan: string; resumes: number;
  interviews: number; builtResumes: number; tokensUsed: number;
}

async function adminFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...opts,
  });
  return res.json();
}

// ── Plan badge ────────────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    elite: { cls: "bg-amber-500/15 text-amber-400 border-amber-500/25", label: "Elite" },
    pro:   { cls: "bg-violet-500/15 text-violet-400 border-violet-500/25", label: "Pro" },
    free:  { cls: "bg-white/5 border-white/10", label: "Free" },
  };
  const { cls, label } = cfg[plan] ?? cfg.free;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}
      style={plan === "free" ? { color: "var(--text-3)" } : {}}>
      {plan !== "free" && <Crown className="h-2.5 w-2.5" />}{label}
    </span>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className={`fixed right-4 top-4 z-[200] flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-2xl transition-all duration-300 ${type === "success" ? "bg-emerald-600/90" : "bg-rose-600/90"}`}
      style={{ backdropFilter: "blur(12px)", border: `1px solid ${type === "success" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}` }}>
      {type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {msg}
    </div>
  );
}

// ── Modal base ────────────────────────────────────────────────────────────────
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

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ user, onConfirm, onCancel, loading }: {
  user: UserRow; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <Modal onClose={onCancel}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15">
          <Trash2 className="h-5 w-5 text-rose-400" />
        </div>
        <div>
          <h3 className="font-bold" style={{ color: "var(--text-1)" }}>Delete User</h3>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>This action cannot be undone</p>
        </div>
        <button onClick={onCancel} className="ml-auto transition-opacity hover:opacity-60" style={{ color: "var(--text-3)" }}><X className="h-5 w-5" /></button>
      </div>
      <p className="mb-5 rounded-xl p-3 text-sm" style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}>
        Permanently delete <strong style={{ color: "var(--text-1)" }}>{user.name}</strong> ({user.email}) and all associated data?
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-hover)" }}>Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600/90 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
        </button>
      </div>
    </Modal>
  );
}

// ── Plan Modal ────────────────────────────────────────────────────────────────
function PlanModal({ user, onConfirm, onCancel, loading }: {
  user: UserRow; onConfirm: (plan: string) => void; onCancel: () => void; loading: boolean;
}) {
  const [sel, setSel] = useState(user.plan || "free");
  const plans = [
    { value: "free",  label: "Free",  desc: "₹0 / month",   dot: "var(--text-3)" },
    { value: "pro",   label: "Pro",   desc: "₹499 / month",  dot: "#8b5cf6" },
    { value: "elite", label: "Elite", desc: "₹999 / month",  dot: "#f59e0b" },
  ];
  return (
    <Modal onClose={onCancel}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
          <Crown className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h3 className="font-bold" style={{ color: "var(--text-1)" }}>Change Plan</h3>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>{user.name} · {user.email}</p>
        </div>
        <button onClick={onCancel} className="ml-auto transition-opacity hover:opacity-60" style={{ color: "var(--text-3)" }}><X className="h-5 w-5" /></button>
      </div>
      <div className="mb-5 space-y-2">
        {plans.map(p => (
          <button key={p.value} onClick={() => setSel(p.value)}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200"
            style={{
              border: sel === p.value ? "2px solid #8b5cf6" : "1px solid var(--border)",
              background: sel === p.value ? "var(--bg-active)" : "var(--bg-hover)",
            }}>
            <div className={`h-4 w-4 rounded-full border-2 transition-all ${sel === p.value ? "border-violet-400 bg-violet-400" : "border-slate-500"}`} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{p.label}</span>
            <span className="ml-auto text-xs" style={{ color: "var(--text-3)" }}>{p.desc}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-xl py-2.5 text-sm font-medium"
          style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-hover)" }}>Cancel</button>
        <button onClick={() => onConfirm(sel)} disabled={loading || sel === user.plan}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600/90 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Update Plan
        </button>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [planTarget, setPlanTarget] = useState<UserRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: "15", search, plan: planFilter });
      const data = await adminFetch(`/api/admin/users?${q}`);
      setUsers(data.users || []); setTotal(data.total || 0); setTotalPages(data.totalPages || 1);
    } catch { showToast("Failed to load users", "error"); }
    finally { setLoading(false); }
  }, [page, search, planFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      if (res.message) { showToast(`${deleteTarget.name} deleted`); setDeleteTarget(null); load(); }
      else throw new Error(res.message);
    } catch { showToast("Delete failed", "error"); }
    finally { setActionLoading(false); }
  };

  const handlePlanChange = async (plan: string) => {
    if (!planTarget) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/users/${planTarget.id}/plan`, { method: "PATCH", body: JSON.stringify({ plan }) });
      if (res.user) { showToast(`Plan updated to ${plan}`); setPlanTarget(null); load(); }
      else throw new Error(res.message);
    } catch { showToast("Update failed", "error"); }
    finally { setActionLoading(false); }
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const TABS = [{ v: "all", l: "All" }, { v: "premium", l: "Premium" }, { v: "free", l: "Free" }];

  return (
    <AdminShell>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {deleteTarget && <DeleteModal user={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={actionLoading} />}
      {planTarget && <PlanModal user={planTarget} onConfirm={handlePlanChange} onCancel={() => setPlanTarget(null)} loading={actionLoading} />}

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Users</h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-3)" }}>{total.toLocaleString()} total registered users</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search name or email…"
              className="w-56 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-200"
              style={{ border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", backdropFilter: "blur(12px)" }}
              onFocus={e => e.target.style.borderColor = "var(--border-hover)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          <button type="submit" className="rounded-xl bg-violet-600/90 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors">Search</button>
        </form>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-xl p-1 w-fit" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", backdropFilter: "blur(12px)" }}>
        {TABS.map(t => (
          <button key={t.v} onClick={() => { setPlanFilter(t.v); setPage(1); }}
            className="rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200"
            style={{
              background: planFilter === t.v ? "var(--bg-active)" : "transparent",
              color: planFilter === t.v ? "var(--text-active)" : "var(--text-3)",
              boxShadow: planFilter === t.v ? "0 2px 8px rgba(139,92,246,0.15)" : "none",
            }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <SkeletonPulse className="h-9 w-9 flex-shrink-0 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonPulse className="h-3 w-32" />
                  <SkeletonPulse className="h-2.5 w-48" />
                </div>
                <SkeletonPulse className="h-5 w-16 rounded-full" />
                <SkeletonPulse className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users className="h-12 w-12 opacity-20" style={{ color: "var(--text-3)" }} />
            <p className="text-sm" style={{ color: "var(--text-3)" }}>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ borderBottom: "1px solid var(--border)" }}>
                <tr>
                  {["User", "Plan", "Verified", "Joined", "Resumes", "Interviews", "Tokens", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} className="transition-colors duration-150"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <td className="cursor-pointer px-4 py-3" onClick={() => router.push(`/admin/users/${u.id}`)}>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/80 to-indigo-600/80 text-xs font-bold text-white">
                          {u.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: "var(--text-1)" }}>{u.name}</p>
                          <p className="text-xs" style={{ color: "var(--text-3)" }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><PlanBadge plan={u.plan || "free"} /></td>
                    <td className="px-4 py-3">
                      {u.emailVerified ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4" style={{ color: "var(--text-3)" }} />}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs" style={{ color: "var(--text-2)" }}>{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 tabular-nums text-xs" style={{ color: "var(--text-2)" }}>{u.resumes}</td>
                    <td className="px-4 py-3 tabular-nums text-xs" style={{ color: "var(--text-2)" }}>{u.interviews}</td>
                    <td className="px-4 py-3 tabular-nums text-xs font-semibold" style={{ color: u.tokensUsed > 0 ? "#f59e0b" : "var(--text-3)" }}>
                      {u.tokensUsed > 0 ? u.tokensUsed.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={e => { e.stopPropagation(); setPlanTarget(u); }}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-violet-500/10 hover:text-violet-400"
                          style={{ border: "1px solid var(--border)", color: "var(--text-3)" }}>
                          <Crown className="h-3 w-3" /> Plan
                        </button>
                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(u); }}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-rose-500/10 hover:text-rose-400"
                          style={{ border: "1px solid var(--border)", color: "var(--text-3)" }}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>Page {page} of {totalPages} · {total} users</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition-all hover:opacity-80 disabled:opacity-30"
                style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-hover)" }}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition-all hover:opacity-80 disabled:opacity-30"
                style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-hover)" }}>
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </AdminShell>
  );
}
