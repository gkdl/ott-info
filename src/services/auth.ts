import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useBlockStore } from "@/store/blockStore";
import type { InsertDto } from "@/types/database";

// expo-web-browser가 OAuth 완료 후 세션을 정상 종료하도록 등록
WebBrowser.maybeCompleteAuthSession();

// ─── 상수 ─────────────────────────────────────────────────────────────────────

// Supabase 콘솔 Auth > Providers > Kakao 에 등록한 것과 동일한 URL
const REDIRECT_URI = makeRedirectUri({
  scheme: process.env.EXPO_PUBLIC_APP_SCHEME ?? "ott-app",
  path: "auth/callback",
});

// ─── 카카오 로그인 ────────────────────────────────────────────────────────────

export type KakaoLoginResult =
  | { status: "success"; isNewUser: boolean }
  | { status: "cancelled" }
  | { status: "error"; message: string };

export async function signInWithKakao(): Promise<KakaoLoginResult> {
  try {
    // 1. Supabase가 생성한 카카오 OAuth URL로 브라우저 오픈
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: REDIRECT_URI,
        skipBrowserRedirect: true, // 수동으로 WebBrowser를 제어
      },
    });

    if (error || !data.url) {
      return { status: "error", message: error?.message ?? "OAuth URL 생성 실패" };
    }

    // 2. 시스템 브라우저에서 카카오 로그인 진행
    const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);

    if (result.type === "cancel" || result.type === "dismiss") {
      return { status: "cancelled" };
    }

    if (result.type !== "success" || !result.url) {
      return { status: "error", message: "인증 브라우저에서 오류가 발생했습니다." };
    }

    // 3. 콜백 URL의 토큰 파라미터를 Supabase에 전달하여 세션 수립
    const url = new URL(result.url);

    // Supabase는 URL 프래그먼트(#)에 access_token / refresh_token을 담아 반환
    const params = new URLSearchParams(url.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return { status: "error", message: "토큰을 받지 못했습니다." };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !sessionData.session) {
      return { status: "error", message: sessionError?.message ?? "세션 설정 실패" };
    }

    const user = sessionData.session.user;

    // 4. profiles upsert — 최초 로그인 판별 및 프로필 생성/갱신
    //    카카오 user_metadata에 nickname, avatar_url이 담겨옴
    const nickname =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      "사용자";
    // 카카오 프로필 이미지는 http로 오는 경우가 있어 https로 강제 (안드로이드 cleartext 차단 회피)
    const rawAvatar = user.user_metadata?.avatar_url as string | undefined;
    const avatarUrl = rawAvatar
      ? rawAvatar.replace(/^http:\/\//, "https://")
      : null;

    const profilePayload: InsertDto<"profiles"> = {
      id: user.id,
      nickname,
      avatar_url: avatarUrl,
    };

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    const isNewUser = existingProfile === null;

    // onConflict: id 충돉 시 닉네임/아바타 갱신 (카카오 프로필 변경 반영)
    await supabase.from("profiles").upsert(profilePayload, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    // 5. 스토어 즉시 업데이트 (onAuthStateChange 전 선반영)
    useAuthStore.getState().setSession(sessionData.session);
    useAuthStore.getState().setProfile({ ...profilePayload, avatar_url: profilePayload.avatar_url ?? null, updated_at: new Date().toISOString() });

    return { status: "success", isNewUser };
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[auth] signInWithKakao error:", message);
    return { status: "error", message };
  }
}

// ─── 로그아웃 ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  // onAuthStateChange의 SIGNED_OUT 이벤트가 스토어 초기화를 담당.
  // 명시적으로 리셋하여 이벤트 지연 시에도 즉시 UI 반영.
  useAuthStore.getState().reset();
  useBlockStore.getState().setBlockedUserIds([]);
}

// ─── 회원탈퇴 ─────────────────────────────────────────────────────────────────
// service_role을 사용하는 Edge Function에 위임.
// 클라이언트 anon key로는 auth.users 행 직접 삭제 불가.
//
// 삭제 연쇄 흐름:
//   Edge Function이 auth.admin.deleteUser(userId) 호출
//   → auth.users 행 삭제
//   → profiles ON DELETE CASCADE
//   → reviews / favorites / review_likes / reports / blocks ON DELETE CASCADE
//   모든 개인 데이터가 DB에서 완전히 제거됨.

export type DeleteAccountResult =
  | { status: "success" }
  | { status: "error"; message: string };

export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { status: "error", message: "로그인 상태가 아닙니다." };
    }

    const { error } = await supabase.functions.invoke("delete-account", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    // Edge Function에서 auth.users 삭제 완료 → 로컬 세션/스토어 정리
    await supabase.auth.signOut({ scope: "local" });
    useAuthStore.getState().reset();
    useBlockStore.getState().setBlockedUserIds([]);

    return { status: "success" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("[auth] deleteAccount error:", message);
    return { status: "error", message };
  }
}

// ─── EULA 동의 저장 ───────────────────────────────────────────────────────────
// 최초 로그인 후 EULA 모달을 표시하고, 동의 시 profiles에 동의 시각을 기록.
// DB 컬럼: profiles.eula_agreed_at (timestamp, nullable)
// 미동의 상태에서 리뷰/즐겨찾기 등 UGC 기능 진입 시 EULA 모달을 재표시.

export async function agreeToEula(userId: string): Promise<void> {
  await supabase
    .from("profiles")
    .update({ eula_agreed_at: new Date().toISOString() } as never)
    .eq("id", userId);
}

export async function hasAgreedToEula(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("eula_agreed_at")
    .eq("id", userId)
    .single();

  return !!(data as { eula_agreed_at: string | null } | null)?.eula_agreed_at;
}

// ─── 닉네임 수정 ──────────────────────────────────────────────────────────────

export async function updateNickname(userId: string, nickname: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ nickname, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  useAuthStore.getState().setProfile({
    ...useAuthStore.getState().profile!,
    nickname,
    updated_at: new Date().toISOString(),
  });
}
