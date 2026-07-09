"use client";

import { useAuth } from "@/hooks/useAuth";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

interface Props {
  children: React.ReactNode;
  title?: string;
  requireAuth?: boolean;
}

export function AppShell({ children, title, requireAuth = true }: Props) {
  const { isAuthenticated, hydrated } = useAuth(requireAuth);

  // Show spinner only on the very FIRST load before hydration completes
  // On client-side navigation, hydrated is already true so spinner never flashes
  if (requireAuth && !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  // After hydration, if not authenticated, redirect is already in flight — show nothing
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="flex min-h-screen flex-col">
        <Navbar title={title} />
        <main
          className="relative flex-1 w-full px-4 pb-10 pt-6 sm:px-6 md:px-8 lg:px-10 xl:px-12"
          style={{
            backgroundImage:
              'linear-gradient(90deg,rgba(2,6,23,0.96) 0%,rgba(2,6,23,0.92) 26%,rgba(2,6,23,0.82) 54%,rgba(2,6,23,0.76) 100%), linear-gradient(180deg,rgba(2,6,23,0.3) 0%,rgba(2,6,23,0.48) 40%,rgba(2,6,23,0.82) 100%), radial-gradient(circle at 76% 22%,rgba(56,189,248,0.16),transparent 24%), radial-gradient(circle at 18% 16%,rgba(139,92,246,0.18),transparent 26%), url("/glowing.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
