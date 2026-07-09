import type { Metadata } from "next";
import ResumeBuilderPageClient from "./ResumeBuilderPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vita.genixpay.com";

export const metadata: Metadata = {
  title: "AI Resume Builder — Create ATS-Optimized Resumes | Vita",
  description: "Build your professional, ATS-optimized resume using our free AI-powered builder workspace. Choose from 11 templates, write bullet points with AI, and download in PDF.",
  alternates: {
    canonical: `${siteUrl}/resume/builder`,
  },
  openGraph: {
    title: "AI Resume Builder — Create ATS-Optimized Resumes | Vita",
    description: "Build your professional, ATS-optimized resume using our free AI-powered builder workspace. Choose from 11 templates, write bullet points with AI, and download in PDF.",
    url: `${siteUrl}/resume/builder`,
    type: "website",
  },
  twitter: {
    title: "AI Resume Builder — Create ATS-Optimized Resumes | Vita",
    description: "Build your professional, ATS-optimized resume using our free AI-powered builder workspace. Choose from 11 templates, write bullet points with AI, and download in PDF.",
  },
};

export default function ResumeBuilderPage() {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Build a Professional ATS-Optimized Resume",
    "description": "Create and download an ATS-friendly, professional resume in under 10 minutes using Vita's AI-assisted workspace.",
    "totalTime": "PT10M",
    "step": [
      {
        "@type": "HowToStep",
        "url": `${siteUrl}/resume/builder`,
        "name": "Choose a Template",
        "text": "Select from 11 professionally designed ATS-friendly resume templates. You can switch templates at any time without losing your content.",
        "image": `${siteUrl}/images/how-to-template.jpg`
      },
      {
        "@type": "HowToStep",
        "url": `${siteUrl}/resume/builder`,
        "name": "Enter Your Resume Details",
        "text": "Fill in your contact information, work experience, education history, skills, and summary. You can re-order sections as needed.",
        "image": `${siteUrl}/images/how-to-details.jpg`
      },
      {
        "@type": "HowToStep",
        "url": `${siteUrl}/resume/builder`,
        "name": "Write and Optimize with AI",
        "text": "Use our built-in Vita AI tools to generate professional bullet points, draft compelling summaries, and optimize keywords to match job descriptions.",
        "image": `${siteUrl}/images/how-to-ai.jpg`
      },
      {
        "@type": "HowToStep",
        "url": `${siteUrl}/resume/builder`,
        "name": "Download and Export",
        "text": "Export your finalized resume instantly. Download as a clean PDF or editable DOCX format, fully optimized for ATS scanners.",
        "image": `${siteUrl}/images/how-to-export.jpg`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <ResumeBuilderPageClient />
    </>
  );
}
