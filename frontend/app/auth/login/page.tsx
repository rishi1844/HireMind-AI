import type { Metadata } from "next";
import LoginPageClient from "./LoginPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vita.genixpay.com";

export const metadata: Metadata = {
  title: "Sign In / Register — Vita",
  description: "Log in or create a free account to access your AI resume builder workspace, ATS checks, and mock interview practice.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${siteUrl}/auth/login`,
  },
  openGraph: {
    title: "Sign In / Register — Vita",
    description: "Log in or create a free account to access your AI resume builder workspace, ATS checks, and mock interview practice.",
    url: `${siteUrl}/auth/login`,
    type: "website",
  },
  twitter: {
    title: "Sign In / Register — Vita",
    description: "Log in or create a free account to access your AI resume builder workspace, ATS checks, and mock interview practice.",
  },
};

export default function LoginPage() {
  return <LoginPageClient />;
}
