import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useBlockStore } from "@/store/blockStore";
import { useOttPrefStore } from "@/store/ottPrefStore";

// 앱 최상단에서 1회 마운트. Supabase 세션 변경을 구독하여 authStore를 동기화.

export function useAuthInit() {
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setBlockedUserIds = useBlockStore((s) => s.setBlockedUserIds);

  useEffect(() => {
    // 기기에 저장된 "구독 중 OTT" 선호 로드 (게스트 포함 개인화)
    useOttPrefStore.getState().hydrate();

    // 앱 시작 시 저장된 세션 복원. 세션이 없으면 익명 로그인으로 게스트 세션을 만든다
    // (콘텐츠 조회는 토큰이 필요하므로). 이 await 동안 status는 "loading"으로 유지되어
    // 토큰 없이 콘텐츠를 패칭하는 레이스를 막는다.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      let active = session;

      if (!active) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.warn(
            "[auth] 익명 로그인 실패 — Supabase 대시보드에서 'Anonymous sign-ins'를 켜야 게스트 둘러보기가 동작합니다:",
            error.message
          );
        }
        active = data?.session ?? null;
      }

      setSession(active);
      if (active?.user && !active.user.is_anonymous) {
        loadProfile(active.user.id);
        loadBlockList(active.user.id);
      }
    });

    // 로그인/로그아웃/토큰 갱신 이벤트 구독 (초기 세션은 위 getSession에서 처리하므로 무시)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION") return;

        setSession(session);

        if (event === "SIGNED_IN" && session?.user && !session.user.is_anonymous) {
          loadProfile(session.user.id);
          loadBlockList(session.user.id);
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          setBlockedUserIds([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) setProfile(data);
  }

  async function loadBlockList(userId: string) {
    const { data } = await supabase
      .from("blocks")
      .select("blocked_user_id")
      .eq("blocker_id", userId);

    if (data) {
      setBlockedUserIds(data.map((b) => b.blocked_user_id));
    }
  }
}
