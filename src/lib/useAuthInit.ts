import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useBlockStore } from "@/store/blockStore";

// 앱 최상단에서 1회 마운트. Supabase 세션 변경을 구독하여 authStore를 동기화.

export function useAuthInit() {
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setBlockedUserIds = useBlockStore((s) => s.setBlockedUserIds);

  useEffect(() => {
    // 앱 시작 시 저장된 세션 복원
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
        loadBlockList(session.user.id);
      }
    });

    // 로그인/로그아웃/토큰 갱신 이벤트 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (event === "SIGNED_IN" && session?.user) {
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
