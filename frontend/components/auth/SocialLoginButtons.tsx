"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface SocialLoginButtonsProps {
  onGoogleSuccess: (token: string) => Promise<void>;
  loading?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function SocialLoginButtons({
  onGoogleSuccess,
  loading = false,
}: SocialLoginButtonsProps) {
  const [googleReady, setGoogleReady] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId || typeof document === "undefined") {
      return;
    }

    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      if (window.google?.accounts?.id) {
        setGoogleReady(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    document.body.appendChild(script);
  }, [googleClientId]);

  const handleGoogleLogin = () => {
    if (loading) {
      return;
    }

    if (!googleClientId) {
      toast.error("Google login is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
      return;
    }

    if (!googleReady || !window.google?.accounts?.id) {
      toast.error("Google login is loading. Please try again in a moment.");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response: any) => {
        if (!response?.credential) {
          toast.error("Google login failed. Please try again.");
          return;
        }

        await onGoogleSuccess(response.credential);
      },
      ux_mode: "popup",
    });

    window.google.accounts.id.prompt();
  };

  return (
    <button
      type="button"
      id="btn-google-login"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}
