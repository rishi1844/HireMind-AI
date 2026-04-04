"use client";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white mb-3">Something went wrong</h2>
        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600
                     text-white font-medium hover:from-violet-500 hover:to-cyan-500 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </motion.div>
    </div>
  );
}
