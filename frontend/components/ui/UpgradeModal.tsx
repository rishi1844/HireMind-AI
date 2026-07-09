"use client";

/**
 * UpgradeModal — Phase 4.1: Usage limits gate for Free plan users.
 * Shows when a user hits their free-tier limit for AI features.
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Crown, Sparkles, X, Zap
} from "lucide-react";
import Link from "next/link";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  usageUsed?: number;
  usageLimit?: number;
}

const PRO_FEATURES = [
  "Unlimited AI resume analyses",
  "Unlimited cover letters",
  "Unlimited job description matching",
  "Unlimited interview sessions",
  "Priority AI processing",
  "Advanced resume templates",
  "Email support",
];

export function UpgradeModal({
  isOpen,
  onClose,
  featureName = "AI feature",
  usageUsed,
  usageLimit,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              id="upgrade-modal"
              className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-violet-500/20 bg-slate-950 shadow-2xl shadow-black/60"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow */}
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-violet-600/8 to-cyan-600/5" />

              {/* Close */}
              <button
                id="upgrade-modal-close"
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-xl border border-white/8 bg-white/5 p-2 text-slate-500 transition-all hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="bg-gradient-to-br from-violet-600/20 to-cyan-600/10 px-6 pt-8 pb-6 text-center border-b border-white/5">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 shadow-lg shadow-violet-900/40">
                  <Crown className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white">Upgrade to Pro</h2>
                <p className="mt-2 text-sm text-slate-400">
                  You&apos;ve reached your free limit for{" "}
                  <span className="font-semibold text-violet-300">{featureName}</span>.
                  {usageUsed != null && usageLimit != null && (
                    <span className="block mt-1 text-slate-500">
                      {usageUsed} / {usageLimit} uses this month
                    </span>
                  )}
                </p>
              </div>

              {/* Features */}
              <div className="px-6 py-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-600">Everything in Pro</p>
                <ul className="space-y-2.5">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="border-t border-white/5 px-6 pb-6 pt-4 space-y-3">
                <Link
                  id="upgrade-cta-btn"
                  href="/pricing"
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3.5 text-sm font-bold text-white transition-all hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-violet-900/30"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade Now — Unlock Everything
                </Link>
                <button
                  onClick={onClose}
                  className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
