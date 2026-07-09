import { create } from "zustand";
import { User } from "./types";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** True once initAuth() has run at least once — prevents spinner on client-side nav */
  hydrated: boolean;
  setAuth: (user: User, token: string, refreshToken?: string | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  hydrated: false,

  setAuth: (user, token, refreshToken = null) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }
    set({ user, token, refreshToken, isAuthenticated: true, hydrated: true });
  },

  setRefreshToken: (refreshToken) => {
    if (typeof window !== "undefined") {
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      else localStorage.removeItem("refreshToken");
    }
    set({ refreshToken });
  },

  updateUser: (updates) =>
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, ...updates };
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user));
      }
      return { ...state, user };
    }),

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("refreshToken");
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    }
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, hydrated: true });
  },

  initAuth: () => {
    // Skip if already hydrated — prevents spinner flash on client-side navigation
    if (get().hydrated) return;

    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        set({ user, token, refreshToken, isAuthenticated: true, hydrated: true });

        // Background refresh user profile to keep plan/status in sync with backend database changes
        (async () => {
          try {
            const { authService } = await import("@/services/api");
            const { data } = await authService.me();
            if (data) {
              localStorage.setItem("user", JSON.stringify(data));
              set({ user: data });
            }
          } catch (err) {
            console.warn("[initAuth] Background sync failed:", err);
          }
        })();
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        set({ hydrated: true });
      }
    } else {
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      set({ hydrated: true });
    }
  },
}));
