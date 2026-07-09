import type { Metadata } from "next";
import UploadPageClient from "./UploadPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vita.genixpay.com";

export const metadata: Metadata = {
  title: "ATS Resume Checker — Analyze & Rate Your CV Free | Vita",
  description: "Check your resume score against ATS algorithms using our AI Resume Analyzer. Upload your PDF to detect keyword gaps, find weaknesses, and optimize formatting.",
  alternates: {
    canonical: `${siteUrl}/resume/upload`,
  },
  openGraph: {
    title: "ATS Resume Checker — Analyze & Rate Your CV Free | Vita",
    description: "Check your resume score against ATS algorithms using our AI Resume Analyzer. Upload your PDF to detect keyword gaps, find weaknesses, and optimize formatting.",
    url: `${siteUrl}/resume/upload`,
    type: "website",
  },
  twitter: {
    title: "ATS Resume Checker — Analyze & Rate Your CV Free | Vita",
    description: "Check your resume score against ATS algorithms using our AI Resume Analyzer. Upload your PDF to detect keyword gaps, find weaknesses, and optimize formatting.",
  },
};

export default function UploadPage() {
  return <UploadPageClient />;
}
