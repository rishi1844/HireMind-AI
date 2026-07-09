"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export function useAuth(requireAuth = true) {
  const { user, isAuthenticated, hydrated, initAuth, logout } = useAuthStore();
  const router = useRouter();

  // Run initAuth once — subsequent calls are no-ops (hydrated guard in store)
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    // Only redirect after hydration is complete — avoids false redirect during SSR/first paint
    if (!hydrated) return;
    if (requireAuth && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [hydrated, isAuthenticated, requireAuth, router]);

  return { user, isAuthenticated, hydrated, logout };
}
