import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Shield, 
  Database, 
  Eye, 
  Users, 
  Clock, 
  Cookie, 
  Lock, 
  UserCheck, 
  Heart, 
  RefreshCw, 
  Mail,
  ArrowLeft,
  ChevronRight
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${BRAND.name} — how we collect, use, and protect your data.`,
};

const LAST_UPDATED = "April 25, 2026";

export default function PrivacyPolicyPage() {
  const CONTACT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support.vita@genixpay.com";

  const sections = [
    {
      id: "introduction",
      title: "1. Introduction",
      icon: Shield,
      content: (
        <>
          <p>
            Welcome to <strong className="text-violet-300 font-medium">{BRAND.name}</strong> ("we",
            "our", or "us"). We are committed to protecting your personal information
            and your right to privacy. This Privacy Policy explains what information we
            collect, how we use it, and what rights you have in relation to it.
          </p>
          <p className="mt-4">
            By accessing or using our platform at{" "}
            <a
              href="https://vita.genixpay.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer underline underline-offset-4 decoration-cyan-400/30 font-medium"
            >
              vita.genixpay.com
            </a>, you agree to the
            collection and use of information in accordance with this policy. If you
            disagree with any part of this policy, please discontinue using our
            services.
          </p>
        </>
      ),
    },
    {
      id: "information-we-collect",
      title: "2. Information We Collect",
      icon: Database,
      content: (
        <>
          <p>We collect information in the following ways to provide a better service:</p>
          <SubList
            items={[
              {
                title: "Account Information",
                desc:
                  "When you register, we collect your name, email address, and encrypted password.",
              },
              {
                title: "Profile Data",
                desc:
                  "Optional information such as your profile picture, job title, LinkedIn URL, and skills that you choose to add.",
              },
              {
                title: "Resume Data",
                desc:
                  "Documents you upload for analysis, including PDFs and DOCX files. These are processed by our AI engine and stored securely for your review.",
              },
              {
                title: "Interview Session Data",
                desc:
                  "Responses, audio (where applicable), and performance metrics from AI-driven mock interview sessions you complete.",
              },
              {
                title: "Usage Data",
                desc:
                  "Browser type, IP address, pages visited, time spent on the platform, and click interactions, collected automatically for analytics and security.",
              },
              {
                title: "Payment Information",
                desc:
                  "If you subscribe to a paid plan, payment details are processed securely through our third-party payment providers. We never store raw card data.",
              },
            ]}
          />
        </>
      ),
    },
    {
      id: "how-we-use",
      title: "3. How We Use Your Information",
      icon: Eye,
      content: (
        <>
          <p>We use your data to power and improve our core AI features:</p>
          <ul className="mt-4 space-y-3 text-slate-300 list-none">
            {[
              `Provide, operate, and maintain the ${BRAND.name} platform.`,
              "Personalise AI-driven resume analysis and interview coaching.",
              "Send transactional emails such as OTPs, password resets, and activity summaries.",
              "Improve our AI models and product features using anonymised, aggregated data.",
              "Detect fraudulent activity, enforce our Terms, and ensure platform security.",
              "Comply with applicable legal obligations.",
            ].map((text, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-slate-300">
            We <strong className="text-white font-semibold">never sell</strong> your personal data to
            third parties, and we do not use your resume or interview content for
            advertising purposes.
          </p>
        </>
      ),
    },
    {
      id: "data-sharing",
      title: "4. Data Sharing & Third Parties",
      icon: Users,
      content: (
        <>
          <p>
            We may share your data with trusted service providers who assist us in
            operating the platform, subject to strict confidentiality agreements:
          </p>
          <SubList
            items={[
              {
                title: "AI Providers",
                desc:
                  "We send resume content to AI APIs solely to generate analysis results. This data is not retained by the provider beyond the request lifecycle.",
              },
              {
                title: "Cloud Infrastructure",
                desc:
                  "Data is stored on secure cloud servers with encrypted storage at rest and in transit (TLS 1.2+).",
              },
              {
                title: "Email Services",
                desc:
                  "We use a transactional email provider to deliver OTPs and notifications to your registered email address.",
              },
              {
                title: "Payment Processors",
                desc:
                  "Your payment details are handled by PCI-DSS-compliant processors. We only receive confirmation of payment status.",
              },
            ]}
          />
        </>
      ),
    },
    {
      id: "data-retention",
      title: "5. Data Retention",
      icon: Clock,
      content: (
        <>
          <p>
            We retain your data for as long as your account is active or as needed to
            provide services. You may delete your account at any time from your Profile
            Settings, which will permanently erase your personal data, resume files, and
            interview history within 30 days, except where retention is required by law.
          </p>
        </>
      ),
    },
    {
      id: "cookies-tracking",
      title: "6. Cookies & Tracking",
      icon: Cookie,
      content: (
        <>
          <p>
            {BRAND.name} uses cookies and similar tracking technologies to maintain your
            login session, remember preferences, and analyse usage patterns. You can
            control cookie behaviour through your browser settings; however, disabling
            cookies may affect your ability to use certain features.
          </p>
          <p className="mt-4">
            We use analytics tools to understand how users interact with our platform.
            All analytics data is anonymised and aggregated.
          </p>
        </>
      ),
    },
    {
      id: "security",
      title: "7. Security Measures",
      icon: Lock,
      content: (
        <>
          <p>
            We implement industry-standard security measures including:
          </p>
          <ul className="mt-4 space-y-3 text-slate-300 list-none">
            {[
              "AES-256 encryption for data at rest.",
              "TLS 1.2+ for all data in transit.",
              "Bcrypt hashing for stored passwords.",
              "JWT-based authentication with short-lived access tokens.",
              "Regular security audits and vulnerability assessments.",
            ].map((text, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5">
            Despite our best efforts, no system is 100% secure. Please notify us
            immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold underline underline-offset-4 decoration-cyan-400/30">
              {CONTACT_EMAIL}
            </a>{" "}
            if you suspect a security breach.
          </p>
        </>
      ),
    },
    {
      id: "your-rights",
      title: "8. Your Rights & Choices",
      icon: UserCheck,
      content: (
        <>
          <p>
            Depending on your jurisdiction, you may have the following legal rights regarding your data:
          </p>
          <ul className="mt-4 space-y-3 text-slate-300 list-none">
            {[
              { label: "Access", text: "request a copy of the personal data we hold about you." },
              { label: "Rectification", text: "correct inaccurate or incomplete data." },
              { label: "Erasure", text: "request deletion of your data (\"right to be forgotten\")." },
              { label: "Portability", text: "receive your data in a structured, machine-readable format." },
              { label: "Objection", text: "object to certain processing activities such as profiling." },
              { label: "Withdraw Consent", text: "withdraw consent at any time where processing is based on consent." },
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                <span>
                  <strong className="text-white font-medium">{item.label}</strong> — {item.text}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5">
            To exercise any of these rights, please contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold underline underline-offset-4 decoration-cyan-400/30">
              {CONTACT_EMAIL}
            </a>
            . We will respond within 30 days.
          </p>
        </>
      ),
    },
    {
      id: "childrens-privacy",
      title: "9. Children's Privacy",
      icon: Heart,
      content: (
        <>
          <p>
            {BRAND.name} is not directed at individuals under the age of 16. We do not
            knowingly collect personal information from children. If we discover that a
            child under 16 has provided us with personal data, we will promptly delete
            it. If you believe a child has submitted personal information, please contact
            us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold underline underline-offset-4 decoration-cyan-400/30">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </>
      ),
    },
    {
      id: "changes-policy",
      title: "10. Changes to This Policy",
      icon: RefreshCw,
      content: (
        <>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will
            revise the "Last updated" date and, for significant changes, notify you via
            email or an in-app notification. Your continued use of {BRAND.name} after
            changes constitutes your acceptance of the updated policy.
          </p>
        </>
      ),
    },
    {
      id: "contact-us",
      title: "11. Contact Us",
      icon: Mail,
      content: (
        <>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy
            Policy, please reach out to our privacy team:
          </p>
          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-slate-950/40 p-6 space-y-3">
            <p className="text-white font-semibold text-base">{BRAND.name} — Privacy & Security Team</p>
            <div className="h-px bg-white/[0.06] w-full" />
            <div className="space-y-1 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <span>Email:</span>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                Platform Operator:{" "}
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
      <Navbar title="Privacy Policy" />

      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-slate-950/30 py-20 lg:py-24">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="absolute left-1/4 top-0 h-[450px] w-[600px] -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute right-1/4 top-0 h-[350px] w-[500px] -translate-y-1/2 rounded-full bg-cyan-500/8 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-xs font-semibold text-violet-300 mb-6 shadow-inner">
            <Shield className="h-3.5 w-3.5" />
            Legal & Trust Center
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Your privacy is our core commitment. Learn how{" "}
            <span className="text-violet-300 font-semibold">{BRAND.name}</span> handles,
            secures, and respects your personal data.
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
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  Navigation
                </h3>
                <nav className="flex flex-col gap-1">
                  {sections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-white/[0.03] hover:text-white transition-all duration-200"
                    >
                      <sec.icon className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-violet-400 transition-colors" />
                      <span className="truncate">{sec.title.split(". ")[1]}</span>
                    </a>
                  ))}
                </nav>
              </div>

              {/* Related Document Cards */}
              <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-violet-500/5 to-cyan-500/5 p-6 space-y-3.5">
                <h4 className="text-xs font-bold text-white tracking-wide">Looking for Terms?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Understand the rules and guidelines governing the use of our resume platform.
                </p>
                <Link
                  href="/terms"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Read Terms & Conditions
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-slate-400 group-hover/sec:border-violet-500/30 group-hover/sec:bg-violet-500/5 group-hover/sec:text-violet-400 transition-all duration-300 shadow-md">
                      <sec.icon className="h-4.5 w-4.5" />
                    </div>
                    <h2 className="text-xl font-bold text-white group-hover/sec:text-violet-200 transition-colors">
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
                  href="/terms" 
                  className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors duration-200 font-medium"
                >
                  Read Terms & Conditions
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
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" />
          <span className="text-slate-300 leading-relaxed">
            <strong className="text-white font-medium">{item.title}:</strong>{" "}
            {item.desc}
          </span>
        </li>
      ))}
    </ul>
  );
}
