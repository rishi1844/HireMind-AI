import type { Metadata } from "next";
import SignupPageClient from "./SignupPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vita.genixpay.com";

export const metadata: Metadata = {
  title: "Create Account — Vita",
  description: "Create a free account to access your AI resume builder workspace, ATS checks, and mock interview practice.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${siteUrl}/auth/signup`,
  },
  openGraph: {
    title: "Create Account — Vita",
    description: "Create a free account to access your AI resume builder workspace, ATS checks, and mock interview practice.",
    url: `${siteUrl}/auth/signup`,
    type: "website",
  },
  twitter: {
    title: "Create Account — Vita",
    description: "Create a free account to access your AI resume builder workspace, ATS checks, and mock interview practice.",
  },
};

export default function SignupPage() {
  return <SignupPageClient />;
}
