"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export function useAuth(requireAuth = true) {
  const { user, isAuthenticated, initAuth, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (requireAuth && !isAuthenticated && typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) router.replace("/auth/login");
    }
  }, [isAuthenticated, requireAuth, router]);

  return { user, isAuthenticated, logout };
}
