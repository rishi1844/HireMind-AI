"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "@/services/api";
import { OtpInput } from "@/components/auth/OtpInput";
import { useAuthStore } from "@/lib/store";
import { Navbar } from "@/components/layout/Navbar";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { isAuthenticated, hydrated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "reset">("request");

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, hydrated, router]);

  if (hydrated && isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!email.trim()) { toast.error("Please enter your email address."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { toast.error("Please enter a valid email address."); return; }

    setLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim().toLowerCase() });
      toast.success("Recovery code sent to your email.");
      setStep("reset");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to send recovery code.");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset Password ──────────────────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error("Enter the 6-digit OTP."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      const { data } = await authService.resetPassword({
        email: email.trim().toLowerCase(),
        otp,
        password,
      });
      setAuth(
        {
          id: data.id,
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          profilePicture: data.profilePicture,
          headline: data.headline,
          bio: data.bio,
          provider: data.provider,
          emailVerified: data.emailVerified,
        },
        data.token,
        data.refreshToken ?? null
      );
      toast.success("Password reset successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-[0_25px_70px_-40px_rgba(0,0,0,0.6)] backdrop-blur-xl">

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Account recovery</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Forgot your password?</h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter your registered email — we&apos;ll send a 6-digit OTP to reset your password.
            </p>
          </div>

          {step === "request" ? (
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                <label className="mb-3 block text-sm font-medium text-slate-300">
                  Registered email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <Mail className="h-4 w-4" />}
                Send recovery code
              </button>

              <p className="text-center text-sm text-slate-400">
                Remembered your password?{" "}
                <Link href="/auth/login" className="text-cyan-300 hover:text-cyan-200">Sign in</Link>
              </p>
            </div>

          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <div className="mb-4 flex items-center gap-3 text-slate-300">
                  <Mail className="h-4 w-4 shrink-0 text-cyan-300" />
                  <p className="text-sm">
                    OTP sent to <span className="font-semibold text-white">{email}</span>
                  </p>
                </div>
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">New password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <ArrowRight className="h-4 w-4" />}
                Reset password
              </button>

              <p className="text-center text-sm text-slate-400">
                Didn&apos;t receive a code?{" "}
                <button
                  type="button"
                  onClick={() => { setStep("request"); setOtp(""); }}
                  className="font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Try again
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
