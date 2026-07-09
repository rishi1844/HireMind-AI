import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { BRAND } from "@/lib/brand";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";
import "./chatbot.css";
import { headers } from "next/headers";
import { DeviceProvider } from "@/hooks/useDevice";
import { DeviceDetails } from "@/lib/deviceDetector";
import dynamic from "next/dynamic";

const ChatbotWidget = dynamic(() => import("@/components/chatbot/ChatbotWidget"), { ssr: false });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vita.genixpay.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Free AI Resume Builder | ATS Score Checker & CV Maker — Vita",
    template: "%s | Vita",
  },
  description: "Build your perfect ATS-optimized resume for free with Vita AI Resume Builder. Get real-time ATS score analysis, mock interview practice, and resume feedback.",
  applicationName: "Vita",
  keywords: [
    "resume builder", "resume maker", "AI resume builder", "free resume builder", "resume builder India",
    "mock interview", "resume analyzer", "resume screening", "CV maker", "CV analyzer", "ATS checker",
    "ATS resume checker", "resume score checker", "AI mock interview", "interview practice",
    "online interview preparation", "cover letter generator", "career assistant", "job preparation", "resume optimization"
  ],
  authors: [{ name: "Vita AI" }],
  creator: "Vita AI",
  publisher: "Vita AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Vita",
    title: "Free AI Resume Builder | ATS Score Checker & CV Maker — Vita",
    description: "Build your perfect ATS-optimized resume for free with Vita AI Resume Builder. Get real-time ATS score analysis, mock interview practice, and resume feedback.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vita AI Resume Builder & Interview Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Resume Builder | ATS Score Checker & CV Maker — Vita",
    description: "Build your perfect ATS-optimized resume for free with Vita AI Resume Builder. Get real-time ATS score analysis, mock interview practice, and resume feedback.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport = {
  themeColor: "#070B14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = headers();
  const initialDevice: DeviceDetails = {
    deviceType: (reqHeaders.get("x-device-type") as any) || "desktop",
    os: reqHeaders.get("x-device-os") || "Windows",
    browser: reqHeaders.get("x-device-browser") || "Chrome",
    isMobile: reqHeaders.get("x-is-mobile") === "true",
    isTablet: reqHeaders.get("x-is-tablet") === "true",
    isDesktop: reqHeaders.get("x-is-desktop") === "true" || !reqHeaders.get("x-is-desktop"),
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ── Import map: resolves bare "three" specifier used by TalkingHead.js CDN module ── */}
        <script
          type="importmap"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              imports: {
                three: "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
                "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/",
              },
            }),
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
        />
      </head>
      <body className="min-h-screen bg-mesh antialiased">
        <DeviceProvider initialDevice={initialDevice}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <ChatbotWidget />
        </DeviceProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(15, 20, 40, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              color: "#e2e8f0",
              fontFamily: "DM Sans, sans-serif",
            },
            success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
            error: { iconTheme: { primary: "#f43f5e", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
