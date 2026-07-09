"use client";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: Props) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#080d18", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Something went wrong
        </h2>
        <p className="text-slate-400 mb-8 text-sm leading-relaxed">
          {error?.message || "An unexpected error occurred. Please try again."}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {/* Try Again */}
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-cyan-500 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          {/* Go to Home — use window.location for reliability in error boundaries */}
          <button
            onClick={() => { window.location.href = "/"; }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cyan-500/25 bg-cyan-500/8 text-cyan-300 text-sm font-medium hover:border-cyan-500/40 hover:bg-cyan-500/15 transition-all"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
