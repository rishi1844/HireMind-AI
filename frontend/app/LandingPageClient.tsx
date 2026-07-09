"use client";

import { useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  FileText,
  Mic,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: FileText,
    title: "AI-Powered Resume Builder",
    desc: "Create an ATS-friendly resume from scratch with step-by-step guidance and 11 professional templates.",
    color: "cyan",
  },
  {
    icon: Brain,
    title: "Free ATS Score Checker",
    desc: "Upload your PDF once and get a detailed ATS score analysis, keyword gaps, and improvement tips.",
    color: "violet",
  },
  {
    icon: Mic,
    title: "AI Mock Interview Practice",
    desc: "Practice voice or text interviews generated from your skills and get immediate scored feedback.",
    color: "emerald",
  },
  {
    icon: BarChart3,
    title: "Resume Analyzer & Feedback",
    desc: "Review previous sessions, custom answer suggestions, and resume progress tracking from a dashboard.",
    color: "amber",
  },
  {
    icon: Shield,
    title: "Private & Secure by Default",
    desc: "JWT-protected data ensures your account, uploaded resumes, and mock session transcripts stay private.",
    color: "rose",
  },
  {
    icon: Zap,
    title: "Fast CV Maker & Export",
    desc: "Move from resume builder to interview practice and export files as PDF or DOCX without context switching.",
    color: "cyan",
  },
];

const stats = [
  { value: "98%", label: "ATS Checker Accuracy" },
  { value: "10x", label: "Faster Interview Prep" },
  { value: "50K+", label: "Resumes Optimized" },
  { value: "4.9/5", label: "Candidate Rating" },
];

export default function LandingPageClient() {
  const { scrollYProgress } = useScroll();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const featuresBgY = useTransform(scrollYProgress, [0.12, 0.42], [-36, 36]);
  const featuresGlowY = useTransform(scrollYProgress, [0.12, 0.42], [28, -28]);
  const featuresBgScale = useTransform(scrollYProgress, [0.12, 0.27, 0.42], [1.12, 1.06, 1.12]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-10%] top-[-20%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute left-[40%] top-[50%] h-[300px] w-[300px] rounded-full bg-emerald-500/5 blur-[80px]" />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 overflow-hidden border-b border-white/6">
        <div className="absolute inset-0">
          <Image
            src="/interview.png"
            alt="AI Resume Builder and ATS Checker Interface"
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
              className="mb-6 max-w-5xl text-4xl font-display font-bold leading-[1.04] text-white md:text-6xl"
            >
              AI Resume Builder — <span className="text-gradient">Build ATS-Optimized Resumes Free</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl"
            >
              Create professional resumes, get instant ATS score checker feedback, optimize your CV keywords, and practice voice or text mock interviews with advanced AI interviewer models.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-16 flex flex-col gap-4 sm:flex-row md:justify-start"
            >
              <Link
                href="/resume/upload"
                className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl shadow-violet-500/20 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-cyan-500"
              >
                Analyze My Resume
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href={isAuthenticated ? "/dashboard" : "/auth/signup"}
                className="rounded-2xl border border-white/10 bg-slate-950/22 px-8 py-4 text-lg font-semibold text-white backdrop-blur-md transition-all hover:bg-white/8"
              >
                {isAuthenticated ? "Explore the Dashboard" : "Create Free Account"}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/8 bg-slate-950/28 p-5 backdrop-blur-md">
                  <div className="mb-1 text-3xl font-display font-bold text-gradient">{stat.value}</div>
                  <div className="text-sm text-slate-300">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 overflow-hidden px-6 py-20 md:px-10 border-b border-white/6">
        <div className="absolute inset-0">
          <motion.div className="absolute inset-0" style={{ y: featuresBgY, scale: featuresBgScale }}>
            <Image src="/glowing.png" alt="Glowing abstract background" fill className="object-cover object-center" />
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
              Professional Tools for <span className="text-gradient">Career Optimization</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">
              From building an ATS-optimized CV to practicing technical mock interviews, we keep your preparation loop connected.
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
                <div className={cnFeatureIcon(feature.color, "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl")}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-display font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-300">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 px-6 py-20 md:px-10 border-b border-white/6 bg-slate-950/20">
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-display font-bold text-white md:text-5xl">
              How Our <span className="text-gradient">AI Resume Builder & Mock Interview</span> Works
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">
              Transform your job application process in three simple, AI-powered steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Build or Upload Your CV",
                desc: "Create an ATS-friendly resume from scratch with our resume builder, or upload an existing PDF for instant screening.",
              },
              {
                step: "02",
                title: "Optimize with ATS Checker",
                desc: "Get an instant ATS score checker report. Identify critical keyword gaps, strengths, and specific section improvements.",
              },
              {
                step: "03",
                title: "Practice Mock Interviews",
                desc: "Rehearse with real-time AI mock interviews tailored to your target job roles. Get scored feedback on every answer.",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative rounded-3xl border border-white/8 bg-slate-900/40 p-8 backdrop-blur-xl">
                <div className="absolute top-6 right-8 text-5xl font-extrabold text-white/5 font-display">{item.step}</div>
                <h3 className="mb-3 text-xl font-bold text-white font-display">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 px-6 py-20 md:px-10 border-b border-white/6 bg-slate-950/10">
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-display font-bold text-white md:text-5xl">
              Success Stories from <span className="text-gradient">Real Candidates</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">
              See how job seekers upgraded their CVs and landed offers using our resume optimizer and mock interviews.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                name: "Rohan Sharma",
                role: "Software Engineer",
                quote: "Vita's ATS checker helped me identify key coding skills missing from my resume. The mock interviews gave me the confidence to handle technical questions. Highly recommended!",
                rating: 5,
              },
              {
                name: "Pooja Patel",
                role: "Product Manager",
                quote: "The resume builder is exceptionally clean. Switching templates is seamless, and the AI writes bullet points that sound incredibly professional and achievement-focused.",
                rating: 5,
              },
              {
                name: "Arjun Verma",
                role: "Data Analyst",
                quote: "I uploaded my resume, got a 65 score, followed the suggestions, and bumped it to 90. Within two weeks, I started getting callback interviews! The mock studio is amazing.",
                rating: 5,
              },
            ].map((t, idx) => (
              <div key={idx} className="rounded-3xl border border-white/8 bg-slate-900/30 p-6 backdrop-blur-xl">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm italic text-slate-300 mb-4">\"{t.quote}\"</p>
                <div className="text-xs font-semibold text-white">{t.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 px-6 py-20 md:px-10 border-b border-white/6 bg-slate-950/40">
        <div className="mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-display font-bold text-white md:text-4xl">
              Frequently Asked Questions (FAQ)
            </h2>
            <p className="text-slate-400 text-sm">Got questions about our resume maker, mock interviews, or ATS tools? We have answers.</p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "Is Vita resume builder free?",
                a: "Yes, Vita offers a fully free plan that allows you to build resumes, use basic templates (Axiom, Editorial), and explore standard AI features.",
              },
              {
                q: "How does the ATS checker work?",
                a: "Vita's ATS checker parses your resume against real-world ATS algorithms to score compatibility, detect keyword gaps, and suggest specific improvements.",
              },
              {
                q: "Can I download my resume as PDF?",
                a: "Yes, you can easily download your resume as a clean, professionally formatted PDF. Premium plans also support DOCX download.",
              },
              {
                q: "What is the AI Mock Interview practice?",
                a: "Vita's Interview Studio generates tailored interview questions from your resume or manual profile, allowing voice or text answers with immediate scored feedback.",
              },
              {
                q: "Can I customize the templates?",
                a: "Yes, Vita allows customization of accent colors, fonts, margins, headings, and font sizes to ensure your resume fits your personal brand.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="rounded-2xl border border-white/8 bg-slate-900/20 p-5 backdrop-blur-md">
                <h3 className="font-semibold text-slate-200 text-base mb-2">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
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
