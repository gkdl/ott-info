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

  setSession: (session) => {
    // 익명(게스트) 세션은 콘텐츠 조회용 토큰 확보 목적일 뿐,
    // 앱 차원에서는 "로그인 안 함"으로 취급한다. → 즐겨찾기/리뷰/마이페이지 게이팅이 그대로 동작.
    const realUser =
      session?.user && !session.user.is_anonymous ? session.user : null;
    set({
      session,
      user: realUser,
      status: realUser ? "authenticated" : "unauthenticated",
    });
  },

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
