"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Mail, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "@/services/api";
import { useAuthStore } from "@/lib/store";
import { OtpInput } from "@/components/auth/OtpInput";
import { Navbar } from "@/components/layout/Navbar";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { isAuthenticated, hydrated } = useAuthStore();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, hydrated, router]);

  useEffect(() => {
    if (hydrated && isAuthenticated) return;
    if (!email) {
      toast.error("Email is required to verify OTP.");
      router.push("/auth/signup");
    }
  }, [email, router, hydrated, isAuthenticated]);

  if (hydrated && isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.verifyOtp({ email, otp });
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
      toast.success("Email verified successfully.");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await authService.resendEmailOtp({ email });
      toast.success("A new verification code has been emailed to you.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Unable to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-[0_25px_70px_-40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="mb-6 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Verify Your Email</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Enter your OTP code</h1>
            <p className="mt-2 text-sm text-slate-400">
              A 6-digit code has been sent to <span className="font-medium text-white">{email}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <div className="mb-4 flex items-center gap-3 text-slate-300">
                <Mail className="h-5 w-5 text-cyan-300" />
                <p className="text-sm">Check your inbox and enter the verification code here.</p>
              </div>
              <OtpInput value={otp} onChange={setOtp} disabled={loading} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <ArrowRight className="h-4 w-4" />}
              Verify OTP
            </button>

            <div className="flex items-center justify-between gap-4 text-sm text-slate-400">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="font-medium text-slate-100 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Resend code
                </span>
              </button>
              <Link href="/auth/login" className="text-cyan-300 hover:text-cyan-200">
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
