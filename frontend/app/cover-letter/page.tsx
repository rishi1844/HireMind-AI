import type { Metadata } from "next";
import CoverLetterPageClient from "./CoverLetterPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vita.genixpay.com";

export const metadata: Metadata = {
  title: "AI Cover Letter Generator — Custom CV Writing Tool | Vita",
  description: "Generate a custom, professional cover letter matched to your resume and job description instantly. Choose your tone, edit the layout, and export to PDF.",
  alternates: {
    canonical: `${siteUrl}/cover-letter`,
  },
  openGraph: {
    title: "AI Cover Letter Generator — Custom CV Writing Tool | Vita",
    description: "Generate a custom, professional cover letter matched to your resume and job description instantly. Choose your tone, edit the layout, and export to PDF.",
    url: `${siteUrl}/cover-letter`,
    type: "website",
  },
  twitter: {
    title: "AI Cover Letter Generator — Custom CV Writing Tool | Vita",
    description: "Generate a custom, professional cover letter matched to your resume and job description instantly. Choose your tone, edit the layout, and export to PDF.",
  },
};

export default function CoverLetterPage() {
  return <CoverLetterPageClient />;
}
