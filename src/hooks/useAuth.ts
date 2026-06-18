import { useState } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { signInWithKakao, signOut, deleteAccount, agreeToEula, updateNickname } from "@/services/auth";
import { useAuthStore, useAuthStatus, useCurrentProfile } from "@/store/authStore";
import { queryClient } from "@/lib/queryClient";
import { confirmDialog, alertDialog } from "@/lib/dialog";

// ─── 카카오 로그인 훅 ─────────────────────────────────────────────────────────

export function useKakaoLogin() {
  const router = useRouter();
  const [showEula, setShowEula] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: signInWithKakao,
    onSuccess: (result) => {
      if (result.status === "cancelled") return;

      if (result.status === "error") {
        alertDialog("로그인 실패", result.message);
        return;
      }

      if (result.isNewUser) {
        // 최초 가입자 → EULA 동의 모달 표시
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          setPendingUserId(userId);
          setShowEula(true);
        }
      } else {
        router.replace("/(tabs)/home");
      }
    },
  });

  async function handleEulaAgree() {
    if (!pendingUserId) return;
    await agreeToEula(pendingUserId);
    setShowEula(false);
    setPendingUserId(null);
    router.replace("/(tabs)/home");
  }

  function handleEulaDecline() {
    // 동의 거부 시 로그아웃 처리
    setShowEula(false);
    setPendingUserId(null);
    signOut();
  }

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    showEula,
    handleEulaAgree,
    handleEulaDecline,
  };
}

// ─── 로그아웃 훅 ──────────────────────────────────────────────────────────────

export function useSignOut() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      // 모든 쿼리 캐시 초기화 (다른 유저 로그인 시 이전 데이터 노출 방지)
      queryClient.clear();
      // 로그아웃 후엔 게스트로 계속 둘러볼 수 있게 홈으로 이동
      router.replace("/(tabs)/home");
    },
    onError: () => {
      alertDialog("오류", "로그아웃 중 문제가 발생했습니다.");
    },
  });

  async function confirmSignOut() {
    if (await confirmDialog("로그아웃", "로그아웃 하시겠습니까?", "로그아웃")) {
      mutation.mutate();
    }
  }

  return { confirmSignOut, isPending: mutation.isPending };
}

// ─── 회원탈퇴 훅 ──────────────────────────────────────────────────────────────

export function useDeleteAccount() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async (result) => {
      if (result.status === "error") {
        alertDialog("오류", result.message);
        return;
      }
      queryClient.clear();
      await alertDialog("탈퇴 완료", "계정과 모든 데이터가 삭제되었습니다.");
      router.replace("/(tabs)/home");
    },
    onError: () => {
      alertDialog("오류", "회원탈퇴 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    },
  });

  async function confirmDeleteAccount() {
    const ok = await confirmDialog(
      "회원탈퇴",
      "탈퇴하면 작성한 리뷰, 즐겨찾기 등 모든 데이터가 영구 삭제되며 복구할 수 없습니다.\n정말 탈퇴하시겠습니까?",
      "탈퇴하기"
    );
    if (ok) mutation.mutate();
  }

  return { confirmDeleteAccount, isPending: mutation.isPending };
}

// ─── 닉네임 수정 훅 ──────────────────────────────────────────────────────────

export function useUpdateNickname() {
  return useMutation({
    mutationFn: ({ userId, nickname }: { userId: string; nickname: string }) =>
      updateNickname(userId, nickname),
    onError: (err: Error) => alertDialog("수정 실패", err.message),
  });
}

// ─── 인증 상태 훅 (컴포넌트 소비용) ─────────────────────────────────────────

export { useAuthStatus, useCurrentProfile };
