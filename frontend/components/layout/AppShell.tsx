"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface Props {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth(true);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
          <main
            className="relative flex-1 px-4 pb-8 pt-5 sm:px-5 md:px-6 lg:px-8"
            style={{ backgroundImage: 'linear-gradient(90deg,rgba(2,6,23,0.96) 0%,rgba(2,6,23,0.92) 26%,rgba(2,6,23,0.82) 54%,rgba(2,6,23,0.76) 100%), linear-gradient(180deg,rgba(2,6,23,0.3) 0%,rgba(2,6,23,0.48) 40%,rgba(2,6,23,0.82) 100%), radial-gradient(circle at 76% 22%,rgba(56,189,248,0.16),transparent 24%), radial-gradient(circle at 18% 16%,rgba(139,92,246,0.18),transparent 26%), url("/glowing.png")', backgroundSize: "cover", backgroundPosition: "center" }}
          >
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
