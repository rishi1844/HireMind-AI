import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  BookOpen, 
  CheckSquare, 
  Fingerprint, 
  FileText, 
  ShieldAlert, 
  CreditCard, 
  Award, 
  Sparkles, 
  Scale, 
  UserMinus, 
  Globe, 
  RefreshCw, 
  Mail,
  ArrowLeft,
  ChevronRight,
  Clock
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms & Conditions for ${BRAND.name} — the rules and guidelines governing your use of our platform.`,
};

const LAST_UPDATED = "April 25, 2026";

export default function TermsPage() {
  const CONTACT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support.vita@genixpay.com";

  const sections = [
    {
      id: "acceptance-of-terms",
      title: "1. Acceptance of Terms",
      icon: BookOpen,
      content: (
        <>
          <p>
            By creating an account, accessing, or using{" "}
            <strong className="text-cyan-300 font-medium">{BRAND.name}</strong> (collectively, the
            "Service"), you confirm that you have read, understood, and agree to be
            bound by these Terms & Conditions and our{" "}
            <Link href="/privacy" className="text-violet-400 hover:text-violet-300 font-medium transition-colors underline underline-offset-4 decoration-violet-400/30">
              Privacy Policy
            </Link>
            , which is incorporated herein by reference.
          </p>
          <p className="mt-4">
            If you do not agree with any of these terms, you are prohibited from using
            the Service. We reserve the right to update these terms at any time with
            notice provided via email or in-app notification.
          </p>
        </>
      ),
    },
    {
      id: "eligibility",
      title: "2. Eligibility",
      icon: CheckSquare,
      content: (
        <>
          <p>
            You must be at least <strong className="text-white font-medium">16 years of age</strong>{" "}
            to use {BRAND.name}. By using the Service, you represent and warrant that:
          </p>
          <ul className="mt-4 space-y-3 text-slate-300 list-none">
            {[
              "You are at least 16 years old.",
              "You have the legal capacity to enter into a binding agreement.",
              "You will comply with these Terms and all applicable laws.",
              "You will not use the Service for any illegal or unauthorised purpose.",
            ].map((text, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "account-registration",
      title: "3. Account Registration",
      icon: Fingerprint,
      content: (
        <>
          <p>
            To access most features of {BRAND.name}, you must create an account. You
            agree to:
          </p>
          <SubList
            items={[
              {
                title: "Accurate Information",
                desc:
                  "Provide truthful, current, and complete information during registration and keep it up to date.",
              },
              {
                title: "Account Security",
                desc:
                  "Maintain the confidentiality of your password and be solely responsible for all activity under your account.",
              },
              {
                title: "Prompt Notification",
                desc:
                  `Notify us immediately at ${CONTACT_EMAIL} of any unauthorised use of your account or any security breach.`,
              },
              {
                title: "One Account per Person",
                desc:
                  "Creating multiple accounts to circumvent restrictions or abuse free-tier limits is strictly prohibited.",
              },
            ]}
          />
        </>
      ),
    },
    {
      id: "permitted-use",
      title: "4. Permitted Use",
      icon: FileText,
      content: (
        <>
          <p>
            {BRAND.name} grants you a limited, non-exclusive, non-transferable, and
            revocable licence to use the Service for your personal, non-commercial
            career development purposes, subject to these Terms.
          </p>
          <p className="mt-4">You are permitted to:</p>
          <ul className="mt-3 space-y-3 text-slate-300 list-none">
            {[
              "Upload your resume for AI-powered analysis and feedback.",
              "Participate in AI mock interview sessions to sharpen your skills.",
              "Build, customise, and download resumes using our Resume Builder.",
              "Access your session history and personalised improvement suggestions.",
            ].map((text, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "prohibited-activities",
      title: "5. Prohibited Activities",
      icon: ShieldAlert,
      content: (
        <>
          <p>
            You agree not to engage in any of the following prohibited activities:
          </p>
          <SubList
            items={[
              {
                title: "Reverse Engineering",
                desc:
                  "Decompile, reverse engineer, disassemble, or attempt to derive the source code of the Service or its AI models.",
              },
              {
                title: "Scraping and Automation",
                desc:
                  "Use bots, scrapers, crawlers, or any automated means to access, collect, or extract data from the platform without prior written consent.",
              },
              {
                title: "Malicious Content",
                desc:
                  "Upload files containing viruses, malware, or any other harmful code.",
              },
              {
                title: "Harassment and Abuse",
                desc:
                  "Use the Service to harass, threaten, defame, or intimidate other users or our team.",
              },
              {
                title: "Intellectual Property Violation",
                desc:
                  "Upload or submit content that infringes any third party's copyright, trademark, or other intellectual property rights.",
              },
              {
                title: "Circumvention",
                desc:
                  "Attempt to bypass any security measure, authentication system, or usage limit of the platform.",
              },
            ]}
          />
        </>
      ),
    },
    {
      id: "subscription-billing",
      title: "6. Subscription and Billing",
      icon: CreditCard,
      content: (
        <>
          <p>
            {BRAND.name} offers both free and paid subscription tiers. For paid plans:
          </p>
          <SubList
            items={[
              {
                title: "Billing Cycle",
                desc:
                  "Subscriptions are billed on the cycle you choose (monthly, quarterly, half-yearly, or annually) and renew automatically until cancelled.",
              },
              {
                title: "Payment",
                desc:
                  "All payments are processed securely. We accept major debit/credit cards and UPI (where applicable).",
              },
              {
                title: "Cancellation",
                desc:
                  "You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period.",
              },
              {
                title: "Refunds",
                desc:
                  "Refunds are evaluated on a case-by-case basis. If you experience a technical issue that prevents you from using the Service, please contact us within 7 days of the charge.",
              },
              {
                title: "Price Changes",
                desc:
                  "We reserve the right to modify pricing with 30 days' advance notice. Continued use after the notice period constitutes acceptance of the new pricing.",
              },
            ]}
          />
        </>
      ),
    },
    {
      id: "intellectual-property",
      title: "7. Intellectual Property",
      icon: Award,
      content: (
        <>
          <p>
            All content on the {BRAND.name} platform — including logos, design, AI
            models, software, text, and graphics — is the exclusive property of{" "}
            <strong className="text-white font-medium">{BRAND.creator}</strong> and protected by
            applicable intellectual property laws.
          </p>
          <p className="mt-4">
            You retain ownership of the content you upload (e.g., your resume). By
            uploading content, you grant {BRAND.name} a limited, worldwide, royalty-free
            licence to process, store, and display that content solely for the purpose
            of providing the Service to you.
          </p>
          <p className="mt-4">
            Your uploaded content will never be used to train our AI models without your
            explicit, opt-in consent.
          </p>
        </>
      ),
    },
    {
      id: "ai-disclaimer",
      title: "8. AI Content Disclaimer",
      icon: Sparkles,
      content: (
        <>
          <p>
            {BRAND.name} uses artificial intelligence to generate resume feedback,
            interview questions, scoring, and suggestions. Please note:
          </p>
          <ul className="mt-4 space-y-3 text-slate-300 list-none">
            {[
              "AI-generated outputs are for guidance purposes only and do not constitute professional career advice.",
              "We do not guarantee that following AI suggestions will result in job offers or improved hiring outcomes.",
              "ATS scores are estimates based on our proprietary model and may differ from actual ATS systems used by employers.",
              "You should exercise your own judgement when applying AI feedback to your job search.",
            ].map((text, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "limitation-of-liability",
      title: "9. Limitation of Liability",
      icon: Scale,
      content: (
        <>
          <p>
            To the maximum extent permitted by applicable law, {BRAND.name} and its
            creator shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, including but not limited to loss of
            data, loss of profits, or loss of goodwill, arising from your use of or
            inability to use the Service.
          </p>
          <p className="mt-4">
            Our total liability to you for all claims arising from these Terms or your
            use of the Service shall not exceed the amount you paid to us in the 3
            months preceding the claim.
          </p>
        </>
      ),
    },
    {
      id: "termination",
      title: "10. Termination",
      icon: UserMinus,
      content: (
        <>
          <p>
            We reserve the right to suspend or permanently terminate your account and
            access to the Service at our sole discretion, without prior notice, if you:
          </p>
          <ul className="mt-4 space-y-3 text-slate-300 list-none">
            {[
              "Violate these Terms or our Privacy Policy.",
              "Engage in fraudulent, abusive, or illegal activity.",
              "Attempt to disrupt the operation of the platform.",
            ].map((text, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5">
            Upon termination, your right to use the Service ceases immediately. You may
            request a data export within 30 days of termination before your data is
            permanently deleted.
          </p>
        </>
      ),
    },
    {
      id: "governing-law",
      title: "11. Governing Law",
      icon: Globe,
      content: (
        <>
          <p>
            These Terms are governed by and construed in accordance with the laws of{" "}
            <strong className="text-white font-medium">India</strong>, without regard to its
            conflict of law provisions. Any disputes arising from these Terms shall be
            subject to the exclusive jurisdiction of the courts of India.
          </p>
        </>
      ),
    },
    {
      id: "changes-to-terms",
      title: "12. Changes to Terms",
      icon: RefreshCw,
      content: (
        <>
          <p>
            We reserve the right to modify these Terms at any time. We will provide at
            least 14 days' notice before material changes take effect — via email or
            in-app notification. Your continued use of the Service after the effective
            date constitutes your acceptance of the revised Terms.
          </p>
        </>
      ),
    },
    {
      id: "contact-us",
      title: "13. Contact Us",
      icon: Mail,
      content: (
        <>
          <p>
            If you have questions, concerns, or feedback about these Terms, please
            contact us:
          </p>
          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-slate-950/40 p-6 space-y-3">
            <p className="text-white font-semibold text-base">{BRAND.name} — Legal & Compliance</p>
            <div className="h-px bg-white/[0.06] w-full" />
            <div className="space-y-1 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <span>Email:</span>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                Creator:{" "}
                <span className="text-slate-300 font-medium">{BRAND.creator}</span>
              </p>
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-300 flex flex-col font-sans">
      <Navbar title="Terms of Service" />

      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-slate-950/30 py-20 lg:py-24">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="absolute left-1/3 top-0 h-[450px] w-[600px] -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="absolute right-1/3 top-0 h-[350px] w-[500px] -translate-y-1/2 rounded-full bg-violet-600/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-xs font-semibold text-cyan-300 mb-6 shadow-inner">
            <BookOpen className="h-3.5 w-3.5" />
            User Agreement
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Terms & Conditions
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully. By accessing and using{" "}
            <span className="text-cyan-300 font-semibold">{BRAND.name}</span>, you agree to comply
            with these guidelines.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500 bg-white/[0.02] border border-white/[0.05] rounded-full py-1.5 px-4 w-fit mx-auto">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Last updated: {LAST_UPDATED}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Sticky Sidebar Navigation (Desktop Only) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-3xl border border-white/[0.06] bg-slate-900/20 backdrop-blur-xl p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  Navigation
                </h3>
                <nav className="flex flex-col gap-1">
                  {sections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-white/[0.03] hover:text-white transition-all duration-200"
                    >
                      <sec.icon className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                      <span className="truncate">{sec.title.split(". ")[1]}</span>
                    </a>
                  ))}
                </nav>
              </div>

              {/* Related Document Cards */}
              <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/5 to-violet-500/5 p-6 space-y-3.5">
                <h4 className="text-xs font-bold text-white tracking-wide">Privacy Concerns?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Learn how we collect, process, and securely store your data.
                </p>
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Read Privacy Policy
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Policy Document Pane */}
          <main className="col-span-1 lg:col-span-9">
            <div className="rounded-3xl border border-white/[0.06] bg-slate-900/10 backdrop-blur-xl p-8 sm:p-12 space-y-16 shadow-2xl shadow-slate-950/40">
              
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  id={sec.id}
                  className="scroll-mt-24 group/sec"
                >
                  {/* Heading */}
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-slate-400 group-hover/sec:border-cyan-500/30 group-hover/sec:bg-cyan-500/5 group-hover/sec:text-cyan-400 transition-all duration-300 shadow-md">
                      <sec.icon className="h-4.5 w-4.5" />
                    </div>
                    <h2 className="text-xl font-bold text-white group-hover/sec:text-cyan-200 transition-colors">
                      {sec.title}
                    </h2>
                  </div>

                  {/* Section Content */}
                  <div className="text-slate-400 text-sm leading-relaxed pl-0 sm:pl-14">
                    {sec.content}
                  </div>

                  {/* Divider */}
                  {idx < sections.length - 1 && (
                    <div className="mt-12 border-b border-white/[0.04] pl-0 sm:pl-14" />
                  )}
                </div>
              ))}

              {/* Bottom Quick Navigation */}
              <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm mt-8">
                <Link 
                  href="/" 
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 group font-medium"
                >
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                  Back to Home
                </Link>
                <Link 
                  href="/privacy" 
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors duration-200 font-medium"
                >
                  Read Privacy Policy
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

            </div>
          </main>

        </div>
      </div>

      <Footer />
    </div>
  );
}

// ─── Helper sub-components ───────────────────────────────────────────────────

function SubList({
  items,
}: {
  items: { title: string; desc: string }[];
}) {
  return (
    <ul className="mt-4 space-y-4">
      {items.map((item) => (
        <li key={item.title} className="flex gap-3 text-sm">
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" />
          <span className="text-slate-300 leading-relaxed">
            <strong className="text-white font-medium">{item.title}:</strong>{" "}
            {item.desc}
          </span>
        </li>
      ))}
    </ul>
  );
}
