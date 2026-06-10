import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { Tables } from "@/types/database";

type Profile = Tables<"profiles">;

// ─── 상태 타입 ────────────────────────────────────────────────────────────────

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: Profile | null;

  // 액션
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  reset: () => void;
}

// ─── 스토어 ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  session: null,
  user: null,
  profile: null,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? "authenticated" : "unauthenticated",
    }),

  setProfile: (profile) => set({ profile }),

  reset: () =>
    set({
      status: "unauthenticated",
      session: null,
      user: null,
      profile: null,
    }),
}));

// ─── 셀렉터 (리렌더 최소화용) ────────────────────────────────────────────────

export const useIsAuthenticated = () =>
  useAuthStore((s) => s.status === "authenticated");

export const useCurrentUser = () => useAuthStore((s) => s.user);

export const useCurrentProfile = () => useAuthStore((s) => s.profile);

export const useAuthStatus = () => useAuthStore((s) => s.status);
