"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Crown,
  Star,
  Brain,
  FileText,
  Mic,
  Shield,
  TrendingUp,
  X,
  Upload,
  Wand2,
  Menu,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { BrandWordmark } from "@/components/ui/BrandWordmark";
import { Navbar } from "@/components/layout/Navbar";
import { BRAND } from "@/lib/brand";
import { useAuthStore } from "@/lib/store";

type BillingCycle = "monthly" | "quarterly" | "halfyear" | "annual";

const BILLING_OPTIONS: { key: BillingCycle; label: string; badge?: string }[] = [
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly", badge: "Save 22%" },
  { key: "halfyear", label: "6 Months", badge: "Save 33%" },
  { key: "annual", label: "Annual", badge: "Save 44%" },
];

interface Plan {
  id: string;
  name: string;
  icon: React.ElementType;
  iconColor: string;
  glowColor: string;
  borderColor: string;
  description: string;
  price: Record<BillingCycle, number>;
  billingNote: Record<BillingCycle, string>;
  features: string[];
  notIncluded?: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    icon: FileText,
    iconColor: "text-slate-400",
    glowColor: "rgba(100,116,139,0.15)",
    borderColor: "rgba(100,116,139,0.2)",
    description: "Get started for free. Build your first resume and explore the basics.",
    price: { monthly: 0, quarterly: 0, halfyear: 0, annual: 0 },
    billingNote: { monthly: "Forever free", quarterly: "Forever free", halfyear: "Forever free", annual: "Forever free" },
    features: [
      "3 resume builder projects",
      "Basic templates (Pulse, Axiom)",
      "5 AI writes/month",
      "3 ATS score checks",
      "1 mock interview session",
      "PDF export (limited)",
    ],
    notIncluded: [
      "Unlimited resumes & AI writes",
      "Premium templates",
      "Docs export & email send",
    ],
    cta: "Get Started Free",
    ctaHref: "/auth/signup",
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    iconColor: "text-violet-400",
    glowColor: "rgba(139,92,246,0.2)",
    borderColor: "rgba(139,92,246,0.35)",
    description: "For serious job seekers who want the full AI-powered resume toolkit.",
    price: { monthly: 199, quarterly: 499, halfyear: 899, annual: 1599 },
    billingNote: {
      monthly: "₹199/month",
      quarterly: "₹166/month · billed ₹499",
      halfyear: "₹150/month · billed ₹899",
      annual: "₹133/month · billed ₹1,599",
    },
    features: [
      "Unlimited resume projects",
      "All templates including Stark, Timeline",
      "500 AI writes/month",
      "PDF & Docs export",
      "Resume email delivery",
      "Unlimited ATS score checks",
      "30 mock interview sessions/month",
      "Profile photo on resume",
      "Theme customization",
      "Priority email support",
    ],
    cta: "Start Pro Plan",
    ctaHref: "/auth/signup",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "elite",
    name: "Elite",
    icon: Crown,
    iconColor: "text-amber-400",
    glowColor: "rgba(245,158,11,0.15)",
    borderColor: "rgba(245,158,11,0.3)",
    description: "Everything in Pro, plus unlimited AI, mock interviews & advanced analytics.",
    price: { monthly: 399, quarterly: 999, halfyear: 1799, annual: 2999 },
    billingNote: {
      monthly: "₹399/month",
      quarterly: "₹333/month · billed ₹999",
      halfyear: "₹300/month · billed ₹1,799",
      annual: "₹250/month · billed ₹2,999",
    },
    features: [
      "Everything in Pro",
      "Unlimited AI writes",
      "Unlimited mock interview sessions",
      "Advanced interview analytics",
      "Early access to new templates",
      "Advanced usage analytics",
      "Priority support (24h response)",
      "1-on-1 onboarding call",
      "API access (coming soon)",
    ],
    cta: "Go Elite",
    ctaHref: "/auth/signup",
    badge: "Best Value",
  },
];

// ─── Coming Soon Modal ────────────────────────────────────────────────────────
function ComingSoonModal({ isOpen, onClose, planName }: { isOpen: boolean; onClose: () => void; planName: string }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative z-10 w-full max-w-md rounded-[2rem] border border-violet-500/20 bg-slate-900 p-8 text-center shadow-2xl shadow-violet-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-600/30 border border-violet-500/20">
              <Sparkles className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="mb-2 text-xl font-display font-bold text-white">
              Payment Gateway Coming Soon!
            </h3>
            <p className="mb-1 text-sm text-slate-400">
              We&apos;re working on integrating secure payments for the{" "}
              <span className="font-semibold text-violet-300">{planName}</span> plan.
            </p>
            <p className="mb-6 text-sm text-slate-500">
              We&apos;ll notify you as soon as it&apos;s live. In the meantime, enjoy everything on the Free plan!
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 transition-all"
              >
                Maybe Later
              </button>
              <Link
                href="/dashboard"
                className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-3 text-center text-sm font-medium text-white hover:from-violet-500 hover:to-cyan-500 transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const FEATURES_COMPARE = [
  { name: "Resume Projects", free: "3", pro: "Unlimited", elite: "Unlimited" },
  { name: "Resume Templates", free: "2 (Pulse, Axiom)", pro: "All templates", elite: "All + early access" },
  { name: "AI Writes/month", free: "5", pro: "500", elite: "✓ Unlimited" },
  { name: "ATS Score Analysis", free: "3/month", pro: "✓ Unlimited", elite: "✓ Unlimited" },
  { name: "Mock Interviews", free: "1/month", pro: "30/month", elite: "✓ Unlimited" },
  { name: "PDF Export", free: "✓ (limited)", pro: "✓", elite: "✓" },
  { name: "Docs (DOCX) Export", free: "—", pro: "✓", elite: "✓" },
  { name: "Resume Email Delivery", free: "—", pro: "✓", elite: "✓" },
  { name: "Profile Photo on Resume", free: "—", pro: "✓", elite: "✓" },
  { name: "Theme Customization", free: "—", pro: "✓", elite: "✓" },
  { name: "Analytics & History", free: "Basic", pro: "Full", elite: "Advanced" },
  { name: "Support", free: "Email", pro: "Priority", elite: "24h Priority" },
  { name: "Early Template Access", free: "—", pro: "—", elite: "✓" },
  { name: "API Access", free: "—", pro: "—", elite: "Coming soon" },
];

const FAQS = [
  {
    q: "Is the Free plan actually free forever?",
    a: "Yes — no credit card needed, no trial period. The Free plan is completely free as long as you want. You can upgrade anytime.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Absolutely. You can cancel any time from your account settings. Your plan stays active until the end of the current billing period.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major UPI apps (GPay, PhonePe, Paytm), debit/credit cards (Visa, Mastercard, RuPay), and net banking through our secure payment gateway.",
  },
  {
    q: "Will I lose my data if I downgrade?",
    a: "No. Your resume data is always safe. If you downgrade to Free, you retain access to your first project. Other projects will be archived and restored if you upgrade again.",
  },
  {
    q: "Do you offer student discounts?",
    a: "Yes! Students with a valid .edu email or college ID can get 40% off any plan. Reach out to our support team to claim your discount.",
  },
];

export default function PricingPageClient() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [comingSoonPlan, setComingSoonPlan] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-20%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute left-[40%] top-[40%] h-[300px] w-[300px] rounded-full bg-amber-500/5 blur-[80px]" />
      </div>

      {/* ── NAV ── */}
      {isAuthenticated ? (
        // ── Logged-in: use the real sticky Navbar (profile, bell, dropdown, hamburger) ──
        <Navbar title="Pricing" />
      ) : (
        // ── Not logged-in: hero image nav ──
        <nav className="relative z-10 overflow-hidden border-white/8 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0">
            <Image
              src="/interview.png"
              alt=""
              fill
              priority
              aria-hidden="true"
              className="scale-[1.06] object-cover object-[76%_22%] opacity-70"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.96)_34%,rgba(2,6,23,0.92)_62%,rgba(2,6,23,0.84)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.88)_0%,rgba(2,6,23,0.8)_42%,rgba(2,6,23,0.92)_100%)]" />
            <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.15),transparent_70%)]" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
            {/* Logo — matching Navbar glow style */}
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-xl group"
            >
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-[3px] rounded-2xl bg-gradient-to-br from-violet-500/40 via-indigo-500/20 to-cyan-500/30 blur-[7px] opacity-80 group-hover:opacity-100 group-hover:blur-[10px] transition-all duration-300" />
                <div className="relative rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 p-[4px] ring-1 ring-white/[0.12] shadow-[0_2px_12px_rgba(109,40,217,0.35),0_1px_3px_rgba(0,0,0,0.6)] group-hover:ring-violet-400/40 group-hover:shadow-[0_4px_20px_rgba(109,40,217,0.5),0_1px_4px_rgba(0,0,0,0.7)] transition-all duration-300">
                  <Image
                    src="/logo.png"
                    alt={`${BRAND.name} logo`}
                    width={40}
                    height={40}
                    className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-lg"
                  />
                </div>
              </div>
              <div>
                <BrandWordmark className="text-[1.25rem] sm:text-[1.4rem]" />
                <p className="hidden text-[10px] text-slate-500 sm:block">Premium AI interview prep</p>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden items-center gap-0.5 lg:flex">
              <Link href="/resume/upload" className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/6 hover:text-white">
                <Upload className="h-3.5 w-3.5" /> Upload Resume
              </Link>
              <Link href="/resume/builder" className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/6 hover:text-white">
                <Wand2 className="h-3.5 w-3.5" /> Resume Builder
              </Link>
              <Link href="/interview" className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/6 hover:text-white">
                <Mic className="h-3.5 w-3.5" /> Interview
              </Link>
            </div>

            {/* Right: Sign In + Pricing + Hamburger */}
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 lg:flex">
                <div className="mr-1 h-4 w-px bg-white/15" />
                <Link href="/auth/login" className="px-3 py-2 text-sm text-slate-300 transition-colors hover:text-white">Sign In</Link>
                <Link href="/pricing" className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-violet-500 hover:to-cyan-500">Pricing</Link>
              </div>
              {/* Hamburger for mobile */}
              <button
                onClick={() => setMobileMenuOpen((c) => !c)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-slate-300 transition-all hover:border-white/20 hover:text-white lg:hidden"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="relative z-10 border-t border-white/8 bg-slate-950/95 px-4 py-3 lg:hidden">
              <div className="space-y-1">
                {[
                  { href: "/resume/upload", label: "Upload Resume", icon: Upload },
                  { href: "/resume/builder", label: "Resume Builder", icon: Wand2 },
                  { href: "/interview", label: "Interview", icon: Mic },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-cyan-400/20 hover:bg-cyan-500/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-slate-400" /> {label}
                  </Link>
                ))}
                <div className="mt-2 flex gap-2 border-t border-white/8 pt-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-center text-sm text-slate-300 transition-colors hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2.5 text-center text-sm font-medium text-white"
                  >
                    Pricing
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>
      )}

      {/* ── HERO ── */}
      <section className="relative z-10 px-6 pb-10 pt-20 text-center md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-slate-950/40 px-4 py-2 backdrop-blur-md"
        >
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-sm text-slate-300">Simple, transparent pricing in ₹ INR</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 text-5xl font-display font-bold text-white md:text-6xl"
        >
          Plans for every {" "}
          <span className="text-gradient">career stage</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-slate-400"
        >
          Start free and upgrade when you need more. All plans include ATS analysis,
          resume builder, and AI interview practice.
        </motion.p>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-14 flex flex-wrap items-center justify-center gap-2"
        >
          {BILLING_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setBilling(opt.key)}
              className={`relative flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-medium transition-all ${billing === opt.key
                ? "border-violet-500/60 bg-violet-600/20 text-white shadow-lg shadow-violet-500/10"
                : "border-white/10 bg-white/4 text-slate-400 hover:border-white/20 hover:text-slate-200"
                }`}
            >
              {opt.label}
              {opt.badge && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  {opt.badge}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* ── CARDS ── */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billing={billing}
              index={index}
              isAuthenticated={isAuthenticated}
              onUpgradeClick={(planName) => setComingSoonPlan(planName)}
            />
          ))}
        </div>
      </section>

      {/* ── FEATURE COMPARE TABLE ── */}
      <section className="relative z-10 px-6 py-20 md:px-10">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className="mb-3 text-3xl font-display font-bold text-white md:text-4xl">
              Compare all features
            </h2>
            <p className="text-slate-400">Everything included in each plan at a glance.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-3xl border border-white/8 bg-slate-900/40 backdrop-blur-xl"
          >
            {/* Table header */}
            <div className="grid grid-cols-4 border-b border-white/8 bg-slate-950/60 px-6 py-4">
              <div className="text-sm font-semibold text-slate-400">Feature</div>
              {["Free", "Pro", "Elite"].map((h) => (
                <div key={h} className="text-center text-sm font-bold text-white">
                  {h}
                </div>
              ))}
            </div>
            {FEATURES_COMPARE.map((row, i) => (
              <div
                key={row.name}
                className={`grid grid-cols-4 px-6 py-3.5 text-sm ${i % 2 === 0 ? "bg-white/2" : ""
                  }`}
              >
                <div className="text-slate-300">{row.name}</div>
                {[row.free, row.pro, row.elite].map((val, vi) => (
                  <div key={vi} className="text-center">
                    {val === "—" ? (
                      <span className="text-slate-600">—</span>
                    ) : val.startsWith("✓") ? (
                      <span className="font-semibold text-emerald-400">{val}</span>
                    ) : (
                      <span className={vi === 1 ? "text-violet-300" : vi === 2 ? "text-amber-300" : "text-slate-400"}>
                        {val}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="relative z-10 px-6 py-12 md:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: Shield, label: "100% Secure Payments", color: "text-emerald-400" },
              { icon: TrendingUp, label: "Cancel Anytime", color: "text-cyan-400" },
              { icon: Brain, label: "Powered by Vita AI", color: "text-violet-400" },
              { icon: Star, label: "4.9/5 User Rating", color: "text-amber-400" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/3 p-5 text-center backdrop-blur-md"
              >
                <Icon className={`h-6 w-6 ${color}`} />
                <p className="text-sm font-medium text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className="mb-3 text-3xl font-display font-bold text-white">
              Frequently asked questions
            </h2>
            <p className="text-slate-400">Everything you need to know before upgrading.</p>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-2xl border border-white/8 bg-slate-900/40 backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-slate-200">{faq.q}</span>
                  <span className={`ml-4 flex-shrink-0 text-slate-400 transition-transform ${openFaq === i ? "rotate-45" : ""}`}>
                    <X className="h-4 w-4" />
                  </span>
                </button>
                {openFaq === i && (
                  <div className="border-t border-white/6 px-6 py-4">
                     <p className="text-sm leading-relaxed text-slate-400">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 px-6 pb-20 md:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl rounded-[2rem] border border-violet-500/20 p-10 text-center glass-card glow-violet"
        >
          <h2 className="mb-3 text-3xl font-display font-bold text-white md:text-4xl">
            Ready to land your dream job?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-slate-400">
            Join thousands of candidates using {BRAND.name} to craft winning resumes and ace their interviews.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-10 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-cyan-500"
          >
            Start for Free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-xs text-slate-600">No credit card required · Cancel anytime</p>
        </motion.div>
      </section>

      <div className="relative z-10">
        <Footer className="border-t border-white/6 bg-transparent" />
      </div>

      <ComingSoonModal
        isOpen={!!comingSoonPlan}
        onClose={() => setComingSoonPlan(null)}
        planName={comingSoonPlan ?? ""}
      />
    </div>
  );
}

function PricingCard({
  plan,
  billing,
  index,
  isAuthenticated,
  onUpgradeClick,
}: {
  plan: Plan;
  billing: BillingCycle;
  index: number;
  isAuthenticated: boolean;
  onUpgradeClick: (planName: string) => void;
}) {
  const price = plan.price[billing];
  const note = plan.billingNote[billing];
  const Icon = plan.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1, type: "spring", stiffness: 100 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="relative"
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
          <span
            className={`rounded-full px-4 py-1 text-xs font-bold ${plan.highlighted
              ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
              : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              }`}
          >
            {plan.badge}
          </span>
        </div>
      )}

      <div
        className={`relative h-full overflow-hidden rounded-3xl border bg-slate-900/60 p-7 backdrop-blur-xl transition-all ${plan.highlighted
          ? "border-violet-500/40 shadow-xl shadow-violet-500/10"
          : plan.id === "elite"
            ? "border-amber-500/30 shadow-lg shadow-amber-500/5"
            : "border-white/10"
          }`}
        style={{
          boxShadow: plan.highlighted
            ? `0 0 60px ${plan.glowColor}, 0 0 120px ${plan.glowColor}`
            : `0 0 40px ${plan.glowColor}`,
        }}
      >
        {/* Subtle gradient mesh */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-30"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${plan.glowColor}, transparent 60%)`,
          }}
        />

        <div className="relative z-10">
          {/* Icon + Name */}
          <div className="mb-5 flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${plan.highlighted ? "border-violet-500/30 bg-violet-500/15" : plan.id === "elite" ? "border-amber-500/30 bg-amber-500/10" : "border-white/10 bg-white/5"
                }`}
            >
              <Icon className={`h-5 w-5 ${plan.iconColor}`} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {BRAND.name}
              </p>
              <h3 className="text-lg font-display font-bold text-white">{plan.name}</h3>
            </div>
          </div>

          {/* Price */}
          <div className="mb-2">
            {price === 0 ? (
              <div className="flex items-end gap-1">
                <span className="text-5xl font-display font-bold text-white">Free</span>
              </div>
            ) : (
              <div className="flex items-end gap-1">
                <span className="text-xl font-semibold text-slate-400">₹</span>
                <span className="text-5xl font-display font-bold text-white">
                  {price.toLocaleString("en-IN")}
                </span>
                {billing === "monthly" && (
                  <span className="mb-1.5 text-sm text-slate-500">/mo</span>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-slate-400">{plan.description}</p>

          {/* CTA */}
          {plan.id === "free" ? (
            <Link
              href={isAuthenticated ? "/dashboard" : "/auth/signup"}
              className="mb-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm font-bold text-slate-200 transition-all hover:scale-[1.02] hover:bg-white/10"
            >
              {isAuthenticated ? "Go to Dashboard" : plan.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={() => onUpgradeClick(plan.name)}
              className={`mb-7 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all hover:scale-[1.02] ${plan.highlighted
                ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-cyan-500"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400"
              }`}
            >
              {plan.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {/* Features */}
          <ul className="space-y-2.5">
            {plan.features.map((feat) => (
              <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-300">
                <Check
                  className={`mt-0.5 h-4 w-4 flex-shrink-0 ${plan.highlighted ? "text-violet-400" : plan.id === "elite" ? "text-amber-400" : "text-emerald-400"
                    }`}
                />
                {feat}
              </li>
            ))}
            {plan.notIncluded?.map((feat) => (
              <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-600">
                <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-700" />
                <span className="line-through">{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
