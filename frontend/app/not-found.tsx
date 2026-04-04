"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Brain, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-md"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-violet-500/30">
          <Brain className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-8xl font-display font-black text-gradient mb-4">404</h1>
        <h2 className="text-2xl font-display font-bold text-white mb-3">Page not found</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600
                       text-white font-medium hover:from-violet-500 hover:to-cyan-500 transition-all"
          >
            <Home className="w-4 h-4" /> Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass border border-white/10 text-slate-300
                       hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
