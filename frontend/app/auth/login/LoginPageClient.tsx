"use client";

import { Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, Sparkles, User as UserIcon, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { BrandWordmark } from "@/components/ui/BrandWordmark";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/lib/store";
import { authService } from "@/services/api";

/* ── Reusable animated input ── */
function AuthInput({
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  required,
  rightSlot,
}: {
  icon: any;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  rightSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={`relative flex items-center rounded-xl border transition-all duration-200 ${focused
          ? "border-violet-500/60 bg-violet-500/5 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
          : "border-white/10 bg-white/[0.04] hover:border-white/20"
        }`}
    >
      <Icon className="ml-3.5 h-4 w-4 shrink-0 text-slate-500" />
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent py-3 pl-3 pr-4 text-sm text-white placeholder:text-slate-600 outline-none"
      />
      {rightSlot}
    </div>
  );
}

/* ── Gradient card wrapper ── */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] p-[1px] ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(56,189,248,0.3) 50%, rgba(139,92,246,0.4) 100%)",
      }}
    >
      <div className="relative h-full w-full rounded-[calc(2rem-1px)] bg-[rgba(8,5,28,0.92)] backdrop-blur-2xl p-8">
        {/* shimmer */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[calc(2rem-1px)] opacity-30"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, transparent 50%, rgba(56,189,248,0.06) 100%)",
          }}
        />
        {children}
      </div>
    </div>
  );
}

function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { isAuthenticated, hydrated } = useAuthStore();

  const [isSignup, setIsSignup] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [signupForm, setSignupForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, hydrated, router]);

  useEffect(() => {
    if (searchParams.get("tab") === "signup") setIsSignup(true);
  }, [searchParams]);

  if (hydrated && isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  const finishAuth = (data: any) => {
    setAuth(
      { id: data.id, name: data.name, email: data.email, provider: data.provider, emailVerified: data.emailVerified, mobile: data.mobile, profilePicture: data.profilePicture, headline: data.headline, bio: data.bio },
      data.token,
      data.refreshToken ?? null   // Phase 2.3: persist refresh token
    );
    router.push("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { data } = await authService.login({ email: loginForm.email.trim().toLowerCase(), password: loginForm.password });
      finishAuth(data);
      toast.success(`Welcome back, ${data.name}!`);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Invalid credentials";
      toast.error(msg);
      if (msg.toLowerCase().includes("verify") && loginForm.email.trim()) {
        router.push(`/auth/verify-otp?email=${encodeURIComponent(loginForm.email.trim().toLowerCase())}`);
      }
    } finally { setLoginLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSignupLoading(true);
    try {
      const payload = { name: signupForm.name.trim(), email: signupForm.email.trim().toLowerCase(), mobile: signupForm.mobile.trim(), password: signupForm.password };
      const { data } = await authService.register(payload);
      if (data?.token) { finishAuth(data); toast.success(`Welcome, ${data.name}!`); return; }
      toast.success(data?.message || "Check your email to verify your account.");
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data?.email || payload.email)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally { setSignupLoading(false); }
  };

  const handleGoogleSuccess = async (token: string) => {
    setGoogleLoading(true);
    try {
      const { data } = await authService.socialLogin({ provider: "google", token });
      finishAuth(data);
      toast.success(`Welcome, ${data.name}!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Google sign-in failed");
    } finally { setGoogleLoading(false); }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10"
        style={{ backgroundImage: "url(/auth.png)", backgroundSize: "cover", backgroundPosition: "center" }}
      >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(2,6,23,0.97) 0%, rgba(2,6,23,0.93) 45%, rgba(10,5,35,0.85) 100%)" }} />

      {/* Animated ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.45) 0%, transparent 65%)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-20 right-1/4 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 65%)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 65%)" }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-5xl items-center gap-14">
        {/* Left panel — desktop only */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden flex-1 lg:block"
        >
          <Link href="/" className="mb-10 inline-flex items-center gap-3">
            <Image src="/logo.png" alt="Vita" width={48} height={48} className="h-12 w-12 object-contain" />
            <div>
              <BrandWordmark className="text-[1.8rem]" />
              <p className="text-sm text-slate-400">AI Resume · Interview Studio</p>
            </div>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignup ? "signup-copy" : "login-copy"}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <h2 className="mb-3 text-4xl font-bold leading-tight text-white">
                {isSignup ? "Start your career\nedge today" : "Welcome\nback"}
              </h2>
              <p className="mb-10 text-lg text-slate-400">
                {isSignup
                  ? "Build smarter resumes and sharper interview skills with AI."
                  : "Pick up where you left off and continue your prep workflow."}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="space-y-5">
            {[
              { icon: "◎", color: "violet", title: "AI Resume Analysis", desc: "Vita AI-powered ATS scoring and feedback" },
              { icon: "◈", color: "cyan", title: "Mock Interviews", desc: "Tailored questions from your resume or profile" },
              { icon: "✦", color: "emerald", title: "Track Progress", desc: "History, scores, and improvement insights" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.45 }}
                className="flex items-start gap-4"
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${f.color === "violet" ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25"
                    : f.color === "cyan" ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/25"
                      : "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
                  }`}>
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Decorative stats */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { value: "98%", label: "ATS Accuracy" },
              { value: "AI", label: "Vita AI Powered" },
              { value: "∞", label: "Practice Sessions" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/6 bg-white/[0.03] py-3 text-center">
                <p className="text-lg font-bold text-violet-300">{s.value}</p>
                <p className="text-[10px] text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right panel — card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full lg:max-w-[430px]"
        >
          <GlassCard>
            {/* Mobile logo */}
            <Link href="/" className="mb-6 inline-flex items-center gap-2.5 lg:hidden">
              <Image src="/logo.png" alt="Logo" width={36} height={36} className="h-9 w-9 object-contain" />
              <BrandWordmark className="text-[1.3rem]" />
            </Link>

            {/* Tab switcher */}
            <div className="relative mb-7 flex rounded-2xl border border-white/8 bg-white/[0.04] p-1">
              <div
                className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 transition-all duration-300 ease-out"
                style={{ transform: isSignup ? "translateX(calc(100% + 8px))" : "translateX(0)" }}
              />
              <button
                type="button"
                onClick={() => setIsSignup(false)}
                className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-200 rounded-xl ${!isSignup ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignup(true)}
                className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-200 rounded-xl ${isSignup ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                Sign Up
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!isSignup ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.28 }}
                >
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                    <p className="mt-1 text-sm text-slate-500">Enter your credentials to continue</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Email</label>
                      <AuthInput icon={Mail} type="email" required value={loginForm.email} onChange={(v) => setLoginForm({ ...loginForm, email: v })} placeholder="you@example.com" />
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Password</label>
                        <Link href="/auth/forgot-password" className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors">Forgot password?</Link>
                      </div>
                      <AuthInput
                        icon={Lock} type={showLoginPwd ? "text" : "password"} required
                        value={loginForm.password} onChange={(v) => setLoginForm({ ...loginForm, password: v })}
                        placeholder="Enter your password"
                        rightSlot={
                          <button type="button" onClick={() => setShowLoginPwd((c) => !c)} className="mr-3.5 text-slate-500 hover:text-white transition-colors">
                            {showLoginPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      />
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loginLoading}
                      className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-cyan-500 hover:shadow-violet-500/40 disabled:opacity-60"
                    >
                      <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-0" />
                      {loginLoading
                        ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        : <><Zap className="h-4 w-4" /><span>Sign In</span><ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></>
                      }
                    </motion.button>
                  </form>

                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/8" />
                    <span className="text-[11px] uppercase tracking-widest text-slate-600">or</span>
                    <div className="h-px flex-1 bg-white/8" />
                  </div>

                  <SocialLoginButtons onGoogleSuccess={handleGoogleSuccess} loading={googleLoading || loginLoading} />
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.28 }}
                >
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">Create account</h1>
                    <p className="mt-1 text-sm text-slate-500">
                      <Sparkles className="mr-1 inline h-3 w-3 text-cyan-400" />
                      Email OTP verification required after signup
                    </p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-3.5">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Full Name</label>
                      <AuthInput icon={UserIcon} type="text" required value={signupForm.name} onChange={(v) => setSignupForm({ ...signupForm, name: v })} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Email</label>
                      <AuthInput icon={Mail} type="email" required value={signupForm.email} onChange={(v) => setSignupForm({ ...signupForm, email: v })} placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Mobile <span className="lowercase normal-case text-slate-600">(optional)</span></label>
                      <AuthInput icon={Phone} type="tel" value={signupForm.mobile} onChange={(v) => setSignupForm({ ...signupForm, mobile: v })} placeholder="+91 9876543210" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Password</label>
                      <AuthInput
                        icon={Lock} type={showSignupPwd ? "text" : "password"} required
                        value={signupForm.password} onChange={(v) => setSignupForm({ ...signupForm, password: v })}
                        placeholder="Min 6 characters"
                        rightSlot={
                          <button type="button" onClick={() => setShowSignupPwd((c) => !c)} className="mr-3.5 text-slate-500 hover:text-white transition-colors">
                            {showSignupPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      />
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={signupLoading}
                      className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-cyan-500 hover:shadow-violet-500/40 disabled:opacity-60"
                    >
                      {signupLoading
                        ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        : <><Sparkles className="h-4 w-4" /><span>Create Account</span><ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></>
                      }
                    </motion.button>
                  </form>

                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/8" />
                    <span className="text-[11px] uppercase tracking-widest text-slate-600">or</span>
                    <div className="h-px flex-1 bg-white/8" />
                  </div>

                  <SocialLoginButtons onGoogleSuccess={handleGoogleSuccess} loading={googleLoading || signupLoading} />
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-5 text-center text-xs text-slate-600">
              By continuing you agree to our{" "}
              <span className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">Terms</span> &{" "}
              <span className="text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
            </p>
          </GlassCard>
        </motion.div>
      </div>
      </div>
    </div>
  );
}

export default function LoginPageClient() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    }>
      <AuthCard />
    </Suspense>
  );
}
