"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { BrandWordmark } from "@/components/ui/BrandWordmark";
import { BRAND } from "@/lib/brand";
import { useAuthStore } from "@/lib/store";
import { authService } from "@/services/api";

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authService.register(form);
      setAuth(
        {
          id: data.id,
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          profilePicture: data.profilePicture,
          headline: data.headline,
          bio: data.bio,
        },
        data.token
      );
      toast.success(`Welcome to ${BRAND.name}`);
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center"
      style={{
        backgroundImage: "url(/auth.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, rgba(2,6,23,0.96) 0%, rgba(2,6,23,0.92) 26%, rgba(2,6,23,0.82) 54%, rgba(2,6,23,0.76) 100%), linear-gradient(180deg, rgba(2,6,23,0.3) 0%, rgba(2,6,23,0.48) 40%, rgba(2,6,23,0.82) 100%), radial-gradient(circle at 76% 22%, rgba(56,189,248,0.16), transparent 24%), radial-gradient(circle at 18% 16%, rgba(139,92,246,0.18), transparent 26%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-6xl items-center gap-12 px-4">
        {/* Left Side - Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden flex-1 lg:block"
        >
          <Link href="/" className="mb-12 inline-flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={48} height={48} className="h-12 w-12 object-contain" />
            <div className="text-left">
              <BrandWordmark className="text-[1.8rem]" />
              <p className="text-sm text-slate-300">AI Resume Analyzer and Interview Studio</p>
            </div>
          </Link>

          <div className="space-y-6">
            <div>
              <h2 className="mb-3 text-4xl font-bold text-white">Join Us Today!</h2>
              <p className="text-xl text-slate-300">Start your journey to interview excellence</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500">
                  <span className="text-sm font-bold text-white">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Upload Your Resume</h3>
                  <p className="text-sm text-slate-400">Get instant AI-powered analysis and feedback</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500">
                  <span className="text-sm font-bold text-white">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Practice with AI</h3>
                  <p className="text-sm text-slate-400">Voice-enabled interview practice sessions</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-500">
                  <span className="text-sm font-bold text-white">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Get Hired</h3>
                  <p className="text-sm text-slate-400">Ace your interviews with confidence</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Signup Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full lg:w-96"
        >
          <div className="rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,rgba(59,130,246,0.14),rgba(236,72,153,0.12),rgba(168,85,247,0.14))] p-8 backdrop-blur-[2px] shadow-[0_30px_90px_-50px_rgba(15,23,42,0.7)]">
            <div className="mb-8 text-center lg:mb-6 lg:text-left">
              <Link href="/" className="mb-6 inline-flex items-center gap-3 lg:hidden">
                <Image src="/logo.png" alt="Logo" width={44} height={44} className="h-11 w-11 object-contain" />
                <div className="text-left">
                  <BrandWordmark className="text-[1.6rem]" />
                  <p className="text-xs text-slate-400">AI Resume Analyzer</p>
                </div>
              </Link>
              <h1 className="mb-2 text-3xl font-bold text-white">Create Account</h1>
              <p className="text-sm text-slate-400">Join and start improving today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="John Doe"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-12 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3.5 font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-violet-400 transition-colors hover:text-violet-300">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
