"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { authService } from "@/services/api";
import { useAuthStore } from "@/lib/store";

export default function LinkedInCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [status, setStatus] = useState("Completing your LinkedIn login...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      setStatus("LinkedIn login failed. Please try again.");
      toast.error(errorDescription || "LinkedIn authorization failed.");
      return;
    }

    if (!code) {
      setStatus("Missing LinkedIn authorization code.");
      return;
    }

    const redirectUri = `${window.location.origin}/auth/linkedin/callback`;

    (async () => {
      try {
        const { data } = await authService.socialLogin({
          provider: "linkedin",
          code,
          redirectUri,
        });

        setAuth(
          {
            id: data.id,
            name: data.name,
            email: data.email,
            mobile: data.mobile,
            profilePicture: data.profilePicture,
            headline: data.headline,
            bio: data.bio,
            provider: data.provider,
            emailVerified: data.emailVerified,
          },
          data.token
        );

        toast.success(`Welcome back, ${data.name}`);
        router.push("/dashboard");
      } catch (error: any) {
        setStatus("LinkedIn login failed. Please try again.");
        toast.error(error.response?.data?.message || "Unable to complete LinkedIn login.");
      }
    })();
  }, [router, searchParams, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 text-center shadow-[0_25px_70px_-40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <h1 className="mb-4 text-3xl font-semibold text-white">LinkedIn login</h1>
        <p className="text-sm text-slate-400">{status}</p>
      </div>
    </div>
  );
}
