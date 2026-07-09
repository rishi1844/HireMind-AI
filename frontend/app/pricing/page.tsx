import type { Metadata } from "next";
import PricingPageClient from "./PricingPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vita.genixpay.com";

export const metadata: Metadata = {
  title: "Premium Plans & Pricing — AI Resume Builder | Vita",
  description: "View pricing plans for Vita AI Resume Builder. Choose from Free, Pro, or Elite tiers for unlimited ATS checks, resume projects, and AI mock interviews.",
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    title: "Premium Plans & Pricing — AI Resume Builder | Vita",
    description: "View pricing plans for Vita AI Resume Builder. Choose from Free, Pro, or Elite tiers for unlimited ATS checks, resume projects, and AI mock interviews.",
    url: `${siteUrl}/pricing`,
    type: "website",
  },
  twitter: {
    title: "Premium Plans & Pricing — AI Resume Builder | Vita",
    description: "View pricing plans for Vita AI Resume Builder. Choose from Free, Pro, or Elite tiers for unlimited ATS checks, resume projects, and AI mock interviews.",
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
