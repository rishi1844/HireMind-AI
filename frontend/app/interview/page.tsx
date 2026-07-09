import type { Metadata } from "next";
import InterviewPageClient from "./InterviewPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vita.genixpay.com";

export const metadata: Metadata = {
  title: "AI Mock Interview Practice — Online Preparation | Vita",
  description: "Practice for job interviews with our real-time AI Mock Interviewer. Get custom resume-based or manual profile questions and detailed scored feedback instantly.",
  alternates: {
    canonical: `${siteUrl}/interview`,
  },
  openGraph: {
    title: "AI Mock Interview Practice — Online Preparation | Vita",
    description: "Practice for job interviews with our real-time AI Mock Interviewer. Get custom resume-based or manual profile questions and detailed scored feedback instantly.",
    url: `${siteUrl}/interview`,
    type: "website",
  },
  twitter: {
    title: "AI Mock Interview Practice — Online Preparation | Vita",
    description: "Practice for job interviews with our real-time AI Mock Interviewer. Get custom resume-based or manual profile questions and detailed scored feedback instantly.",
  },
};

export default function InterviewPage() {
  return <InterviewPageClient />;
}