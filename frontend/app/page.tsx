"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  FileText,
  Menu,
  Mic,
  Shield,
  Star,
  X,
  Zap,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { BrandWordmark } from "@/components/ui/BrandWordmark";
import { BRAND } from "@/lib/brand";
import Image from "next/image";

const features = [
  {
    icon: FileText,
    title: "Smart Resume Upload",
    desc: "Upload a PDF once and turn it into ATS scoring, improvements, and role targeting.",
    color: "cyan",
  },
  {
    icon: Brain,
    title: "Premium AI Analysis",
    desc: "Get polished ATS feedback, strengths, weaknesses, and practice prompts in one flow.",
    color: "violet",
  },
  {
    icon: Mic,
    title: "Interview Studio",
    desc: "Practice voice or text interviews with tailored feedback and model answers.",
    color: "emerald",
  },
  {
    icon: BarChart3,
    title: "History and Insights",
    desc: "Review previous sessions, answers, and progress from a single dashboard.",
    color: "amber",
  },
  {
    icon: Shield,
    title: "Private by Default",
    desc: "JWT-protected flows keep your account and session data isolated.",
    color: "rose",
  },
  {
    icon: Zap,
    title: "Fast Career Prep",
    desc: "Move from resume review to live practice without context switching.",
    color: "cyan",
  },
];

const stats = [
  { value: "95%", label: "ATS Insight Quality" },
  { value: "10x", label: "Faster Practice Loops" },
  { value: "50K+", label: "Career Sessions" },
  { value: "4.9/5", label: "Candidate Rating" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const featuresSectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: featuresScrollProgress } = useScroll({
    target: featuresSectionRef,
    offset: ["start end", "end start"],
  });
  const featuresBgY = useTransform(featuresScrollProgress, [0, 1], [-36, 36]);
  const featuresGlowY = useTransform(featuresScrollProgress, [0, 1], [28, -28]);
  const featuresBgScale = useTransform(featuresScrollProgress, [0, 0.5, 1], [1.12, 1.06, 1.12]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-20%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute left-[40%] top-[50%] h-[300px] w-[300px] rounded-full bg-emerald-500/5 blur-[80px]" />
      </div>

      <nav className="relative z-10 overflow-hidden border-b border-white/8  backdrop-blur-xl">
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

        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt={`${BRAND.name} logo`} width={40} height={40} className="h-10 w-10 object-cover" />
            <div>
              <BrandWordmark className="text-[1.45rem]" />
              <p className="text-xs text-slate-500">Premium AI interview prep</p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/login" className="px-4 py-2 text-sm text-slate-300 transition-colors hover:text-white">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:from-violet-500 hover:to-cyan-500"
            >
              Start Free
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition-colors hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="relative z-10 border-t border-white/8 bg-slate-950/72 px-6 py-4 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-3">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-3 text-center text-sm font-medium text-white"
              >
                Start Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="relative z-10 overflow-hidden border-b border-white/6">
        <div className="absolute inset-0">
          <Image
            src="/interview.png"
            alt="AI interview background"
            fill
            priority
            className="object-cover object-[72%_center] md:object-[68%_center]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_26%,rgba(101,186,255,0.22),transparent_24%),linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.86)_28%,rgba(2,6,23,0.1)_52%,rgba(2,6,23,0)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.22)_0%,rgba(2,6,23,0.36)_42%,rgba(2,6,23,0.88)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-6 py-20 md:px-10">
          <div className="w-full max-w-3xl text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-slate-950/30 px-4 py-2 backdrop-blur-md"
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm text-slate-200">AI-powered resume and interview intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 max-w-5xl text-5xl font-display font-bold leading-[1.04] text-white md:text-7xl"
            >
              Sharpen your job search with <BrandWordmark className="text-[1em] align-baseline" />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl"
            >
              Analyze your resume, generate practice questions from your skills and experience, and train with a clean
              interview workflow built for serious candidates.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-16 flex flex-col gap-4 sm:flex-row md:justify-start"
            >
              <Link
                href="/auth/signup"
                className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-violet-500/20 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-cyan-500"
              >
                Analyze My Resume
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/auth/login"
                className="rounded-2xl border border-white/10 bg-slate-950/22 px-8 py-4 text-lg font-semibold text-white backdrop-blur-md transition-all hover:bg-white/8"
              >
                Explore the Dashboard
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-white/8 bg-slate-950/28 p-5 backdrop-blur-md"
                >
                  <div className="mb-1 text-3xl font-display font-bold text-gradient">{stat.value}</div>
                  <div className="text-sm text-slate-300">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section ref={featuresSectionRef} className="relative z-10 overflow-hidden px-6 py-20 md:px-10">
        <div className="absolute inset-0">
          <motion.div className="absolute inset-0" style={{ y: featuresBgY, scale: featuresBgScale }}>
            <Image
              src="/glowing.png"
              alt="Glowing abstract background"
              fill
              className="object-cover object-center"
            />
          </motion.div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.88)_0%,rgba(8,15,40,0.8)_24%,rgba(8,12,30,0.8)_55%,rgba(2,6,23,0.86)_100%)]" />
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(56,189,248,0.16),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,0.16),transparent_24%),radial-gradient(circle_at_50%_84%,rgba(139,92,246,0.14),transparent_28%)]"
            style={{ y: featuresGlowY }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-display font-bold text-white md:text-5xl">
              Everything you need to <span className="text-gradient">practice better</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">
              From first upload to final interview review, the workflow stays connected and fast.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group rounded-3xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-violet-400/25"
              >
                <div
                  className={cnFeatureIcon(
                    feature.color,
                    "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                  )}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-display font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-300">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 md:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl rounded-[2rem] border border-violet-500/20 p-10 text-center glass-card glow-violet"
        >
          <h2 className="mb-4 text-4xl font-display font-bold text-white md:text-5xl">Ready to train smarter?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400">
            Move from resume analysis into interview rehearsal with a single premium workflow.
          </p>

          <div className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {["ATS feedback", "Quick practice mode", "Interview history"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-10 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-cyan-500"
          >
            Start with {BRAND.name}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      <div className="relative z-10">
        <Footer className="border-t border-white/6 bg-transparent" />
      </div>
    </div>
  );
}

function cnFeatureIcon(color: string, className: string) {
  if (color === "cyan") {
    return `${className} bg-cyan-500/10 text-cyan-400`;
  }
  if (color === "violet") {
    return `${className} bg-violet-500/10 text-violet-400`;
  }
  if (color === "emerald") {
    return `${className} bg-emerald-500/10 text-emerald-400`;
  }
  if (color === "amber") {
    return `${className} bg-amber-500/10 text-amber-400`;
  }
  return `${className} bg-rose-500/10 text-rose-400`;
}
