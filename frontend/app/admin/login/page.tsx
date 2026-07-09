"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, Eye, EyeOff, Sparkles, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

const RAW_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API = RAW_API.replace(/\/+$/, "").replace(/\/api$/, "");

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password Reset Flow State
  const [mode, setMode] = useState<"login" | "forgot" | "otp" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminEmail", data.email);
      toast.success("Welcome, Admin!");
      router.replace("/admin");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Enter admin email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to request OTP");
      toast.success("OTP sent successfully!");
      setMode("otp");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Enter valid 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to verify OTP");
      toast.success("OTP verified successfully!");
      setResetToken(data.resetToken);
      setMode("reset");
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      toast.success("Password reset successfully! Please log in.");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setMode("login");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{ background: "linear-gradient(135deg,#0a0e1a 0%,#0d1230 35%,#130a2e 65%,#0a0a14 100%)", fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]" style={{ background: "rgba(99,102,241,0.15)" }} />
        <div className="absolute right-1/4 bottom-1/3 h-64 w-64 rounded-full blur-[120px]" style={{ background: "rgba(139,92,246,0.1)" }} />
      </div>

      {/* Floating orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {[
          { s: 60, l: "12%", t: "18%", c: "rgba(139,92,246,0.18)", d: 5 },
          { s: 40, l: "75%", t: "12%", c: "rgba(99,102,241,0.15)", d: 7 },
          { s: 80, l: "85%", t: "70%", c: "rgba(109,40,217,0.12)", d: 6 },
          { s: 35, l: "8%", t: "75%", c: "rgba(167,139,250,0.14)", d: 8 },
          { s: 50, l: "50%", t: "85%", c: "rgba(99,102,241,0.10)", d: 9 },
        ].map((o, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: o.s, height: o.s, left: o.l, top: o.t,
              background: o.c, filter: "blur(2px)",
              animation: `floatOrb${i} ${o.d}s ease-in-out infinite alternate`,
            }} />
        ))}
      </div>

      <style>{`
        @keyframes floatOrb0{0%{transform:translateY(0) scale(1)}100%{transform:translateY(-24px) scale(1.05)}}
        @keyframes floatOrb1{0%{transform:translateY(0) scale(1)}100%{transform:translateY(-18px) scale(0.95)}}
        @keyframes floatOrb2{0%{transform:translateY(0) scale(1)}100%{transform:translateY(-30px) scale(1.08)}}
        @keyframes floatOrb3{0%{transform:translateY(0) scale(1)}100%{transform:translateY(-15px) scale(1.03)}}
        @keyframes floatOrb4{0%{transform:translateY(0) scale(1)}100%{transform:translateY(-20px) scale(0.97)}}
        @keyframes logoGlow{0%,100%{box-shadow:0 0 24px rgba(139,92,246,0.5),0 0 48px rgba(99,102,241,0.25)}50%{box-shadow:0 0 40px rgba(139,92,246,0.7),0 0 80px rgba(99,102,241,0.35)}}
      `}</style>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600"
            style={{ animation: "logoGlow 3s ease-in-out infinite" }}>
            {mode === "login" ? <Shield className="h-8 w-8 text-white" /> : <KeyRound className="h-8 w-8 text-white" />}
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <h1 className="text-2xl font-bold text-white">
                {mode === "login" ? "Admin Console" : "Admin Security"}
              </h1>
            </div>
            <p className="mt-1 text-sm" style={{ color: "rgba(168,184,216,0.7)" }}>Vita AI · Restricted Access</p>
          </div>
        </div>

        {/* Glass card */}
        <div className="rounded-2xl p-6 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(168,184,216,0.6)" }}>
                  Admin Email
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter Admin Email" autoComplete="email"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-600"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(139,92,246,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12), 0 0 20px rgba(139,92,246,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(168,184,216,0.6)" }}>
                    Password
                  </label>
                  <button type="button" onClick={() => { setMode("forgot"); setResetEmail(email || "vita@genixpay.com"); }} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••" autoComplete="current-password"
                    className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-600"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => { e.target.style.borderColor = "rgba(139,92,246,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12), 0 0 20px rgba(139,92,246,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                    style={{ color: "rgba(168,184,216,0.5)" }}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  boxShadow: loading ? "none" : "0 8px 24px rgba(124,58,237,0.4), 0 0 40px rgba(99,102,241,0.2)",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(124,58,237,0.5), 0 0 60px rgba(99,102,241,0.3)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(124,58,237,0.4), 0 0 40px rgba(99,102,241,0.2)"}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                {loading ? "Signing in..." : "Sign In to Admin"}
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="text-xs leading-relaxed" style={{ color: "rgba(168,184,216,0.7)" }}>
                Enter your admin email. We will send a 6-digit verification code to reset your password.
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(168,184,216,0.6)" }}>
                  Admin Email
                </label>
                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                  placeholder="vita@genixpay.com" required
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-600"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(139,92,246,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12), 0 0 20px rgba(139,92,246,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  boxShadow: loading ? "none" : "0 8px 24px rgba(124,58,237,0.4), 0 0 40px rgba(99,102,241,0.2)",
                }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Requesting OTP..." : "Request Reset OTP"}
              </button>

              <button type="button" onClick={() => setMode("login")} className="w-full text-center text-xs text-violet-400 hover:text-violet-300 transition-colors py-2 mt-2">
                Back to Sign In
              </button>
            </form>
          )}

          {mode === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-xs leading-relaxed" style={{ color: "rgba(168,184,216,0.7)" }}>
                Enter the 6-digit verification code sent to your email.
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(168,184,216,0.6)" }}>
                  Verification Code (OTP)
                </label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••" required
                  className="w-full rounded-xl px-4 py-3 text-sm text-white tracking-[0.5em] text-center font-bold outline-none transition-all duration-200 placeholder:text-slate-600 placeholder:tracking-normal"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(139,92,246,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12), 0 0 20px rgba(139,92,246,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  boxShadow: loading ? "none" : "0 8px 24px rgba(124,58,237,0.4), 0 0 40px rgba(99,102,241,0.2)",
                }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <div className="flex justify-between items-center mt-2">
                <button type="button" onClick={() => setMode("forgot")} className="text-xs text-violet-400 hover:text-violet-300 transition-colors py-2">
                  Request New OTP
                </button>
                <button type="button" onClick={() => setMode("login")} className="text-xs text-slate-400 hover:text-slate-300 transition-colors py-2">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-xs leading-relaxed" style={{ color: "rgba(168,184,216,0.7)" }}>
                Create a new password for your admin account.
              </div>

              {/* New Password */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(168,184,216,0.6)" }}>
                  New Password
                </label>
                <div className="relative">
                  <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••••" required
                    className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-600"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => { e.target.style.borderColor = "rgba(139,92,246,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12), 0 0 20px rgba(139,92,246,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowNewPw(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                    style={{ color: "rgba(168,184,216,0.5)" }}>
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(168,184,216,0.6)" }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input type={showConfirmPw ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••" required
                    className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-600"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => { e.target.style.borderColor = "rgba(139,92,246,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12), 0 0 20px rgba(139,92,246,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                    style={{ color: "rgba(168,184,216,0.5)" }}>
                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-300 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  boxShadow: loading ? "none" : "0 8px 24px rgba(124,58,237,0.4), 0 0 40px rgba(99,102,241,0.2)",
                }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Saving..." : "Save New Password"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: "rgba(90,106,138,0.7)" }}>
          This area is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}
