"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Brain, Eye, EyeOff, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { BrandWordmark } from "@/components/ui/BrandWordmark";
import { BRAND } from "@/lib/brand";
import { useAuthStore } from "@/lib/store";
import { authService } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await authService.login(form);
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
      toast.success(`Welcome back, ${data.name}`);
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-5%] top-[-10%] h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[350px] w-[350px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-cyan-500 to-emerald-500">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <BrandWordmark className="text-[1.6rem]" />
              <p className="text-xs text-slate-500">AI Resume Analyzer and Interview Studio</p>
            </div>
          </Link>
          <h1 className="mb-2 text-3xl font-display font-bold text-white">Welcome back</h1>
          <p className="text-slate-400">Sign in to continue your interview practice and resume reviews.</p>
        </div>

        <div className="rounded-[2rem] border border-white/8 p-8 glass-card">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Enter your password"
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
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-medium text-violet-400 transition-colors hover:text-violet-300">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
