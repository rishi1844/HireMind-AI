import { create } from "zustand";
import { User } from "./types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }

    set({ user, token, isAuthenticated: true });
  },

  updateUser: (updates) =>
    set((state) => {
      if (!state.user) {
        return state;
      }

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
    }

    set({ user: null, token: null, isAuthenticated: false });
  },

  initAuth: () => {
    if (typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  },
}));
