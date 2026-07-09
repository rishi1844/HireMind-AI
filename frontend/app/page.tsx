import type { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vita.genixpay.com";

export const metadata: Metadata = {
  title: "Free AI Resume Builder | ATS Score Checker & CV Maker — Vita",
  description: "Build your perfect ATS-optimized resume for free with Vita AI Resume Builder. Get real-time ATS score analysis, mock interview practice, and resume feedback.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Free AI Resume Builder | ATS Score Checker & CV Maker — Vita",
    description: "Build your perfect ATS-optimized resume for free with Vita AI Resume Builder. Get real-time ATS score analysis, mock interview practice, and resume feedback.",
    url: siteUrl,
    type: "website",
  },
  twitter: {
    title: "Free AI Resume Builder | ATS Score Checker & CV Maker — Vita",
    description: "Build your perfect ATS-optimized resume for free with Vita AI Resume Builder. Get real-time ATS score analysis, mock interview practice, and resume feedback.",
  },
};

export default function LandingPage() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Vita",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/resume/builder?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Vita AI Resume Builder",
    "description": "Build ATS-optimized resumes free, get instant AI analysis, ATS checker, mock interview prep, and career preparation tools on Vita AI Resume Platform.",
    "url": siteUrl,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "featureList": [
      "AI-Powered Resume Builder",
      "Free ATS Score Checker",
      "AI Mock Interview Practice",
      "Resume Analyzer & Feedback",
      "PDF & DOCX Export"
    ]
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Vita",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is Vita resume builder free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Vita offers a fully free plan that allows you to build resumes, use basic templates (Axiom, Editorial), and explore standard AI features."
        }
      },
      {
        "@type": "Question",
        "name": "How does the ATS checker work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vita's ATS checker parses your resume against real-world ATS algorithms to score compatibility, detect keyword gaps, and suggest specific improvements."
        }
      },
      {
        "@type": "Question",
        "name": "Can I download my resume as PDF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can easily download your resume as a clean, professionally formatted PDF. Premium plans also support DOCX download."
        }
      },
      {
        "@type": "Question",
        "name": "What is the AI Mock Interview practice?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vita's Interview Studio generates tailored interview questions from your resume or manual profile, allowing voice or text answers with immediate scored feedback."
        }
      },
      {
        "@type": "Question",
        "name": "Can I customize the templates?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Vita allows customization of accent colors, fonts, margins, headings, and font sizes to ensure your resume fits your personal brand."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingPageClient />
    </>
  );
}
