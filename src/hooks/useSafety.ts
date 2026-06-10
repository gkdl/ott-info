import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import {
  reportReview,
  toggleBlock,
  type ReportInput,
  type BlockInput,
  REPORT_REASONS,
} from "@/services/safety";
import { useBlockStore } from "@/store/blockStore";
import { useCurrentUser } from "@/store/authStore";
import { reviewKeys } from "./useReviews";

export { REPORT_REASONS };

// ─── 신고 ─────────────────────────────────────────────────────────────────────

export function useReportReview() {
  const user = useCurrentUser();

  return useMutation({
    mutationFn: (input: Omit<ReportInput, "reporterId">) => {
      if (!user) throw new Error("로그인이 필요합니다.");
      return reportReview({ ...input, reporterId: user.id });
    },

    onSuccess: (result) => {
      switch (result.status) {
        case "success":
          Alert.alert("신고 완료", "신고가 접수되었습니다. 24시간 이내에 검토합니다.");
          break;
        case "self_report":
          Alert.alert("알림", "자신의 리뷰는 신고할 수 없습니다.");
          break;
        case "duplicate":
          Alert.alert("알림", "이미 신고한 리뷰입니다.");
          break;
        case "error":
          Alert.alert("오류", result.message);
          break;
      }
    },
  });
}

// ─── 차단 토글 (낙관적 업데이트) ─────────────────────────────────────────────
// 차단 즉시:
//   1. blockStore에 ID 추가 → 클라이언트 피드에서 즉각 숨김
//   2. reviews 쿼리 invalidate → RPC가 재호출되며 서버에서도 제외

export function useBlockToggle() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const { addBlock, removeBlock, isBlocked } = useBlockStore();

  return useMutation({
    mutationFn: (input: Omit<BlockInput, "blockerId">) => {
      if (!user) throw new Error("로그인이 필요합니다.");
      return toggleBlock({ ...input, blockerId: user.id });
    },

    onMutate: async ({ blockedUserId }) => {
      // 낙관적으로 스토어 즉시 반영
      const wasBlocked = isBlocked(blockedUserId);
      if (wasBlocked) {
        removeBlock(blockedUserId);
      } else {
        addBlock(blockedUserId);
      }
      return { blockedUserId, wasBlocked };
    },

    onSuccess: (result, { blockedUserId }, context) => {
      switch (result.status) {
        case "blocked":
          // 서버 확정 → 리뷰 목록 갱신 (차단 유저 리뷰 제거)
          queryClient.invalidateQueries({ queryKey: reviewKeys.all });
          Alert.alert("차단 완료", "해당 유저를 차단했습니다. 이 유저의 리뷰가 숨겨집니다.");
          break;

        case "unblocked":
          queryClient.invalidateQueries({ queryKey: reviewKeys.all });
          Alert.alert("차단 해제", "차단이 해제되었습니다.");
          break;

        case "self_block":
          // 낙관적 업데이트 롤백
          if (context?.wasBlocked) {
            addBlock(blockedUserId);
          } else {
            removeBlock(blockedUserId);
          }
          Alert.alert("알림", "자기 자신을 차단할 수 없습니다.");
          break;

        case "error":
          // 롤백
          if (context?.wasBlocked) {
            addBlock(blockedUserId);
          } else {
            removeBlock(blockedUserId);
          }
          Alert.alert("오류", result.message);
          break;
      }
    },

    onError: (_err, _vars, context) => {
      // 네트워크 오류 등 — 낙관적 업데이트 롤백
      if (!context) return;
      if (context.wasBlocked) {
        addBlock(context.blockedUserId);
      } else {
        removeBlock(context.blockedUserId);
      }
    },
  });
}

// ─── 신고 + 즉시 차단 복합 액션 ──────────────────────────────────────────────
// "신고하기" 버튼 하나로 신고 저장 + 차단 처리를 한 번에 수행하는 헬퍼.
// UX: 신고 Sheet에서 사유 선택 후 "신고 및 차단" 버튼 클릭 시 사용.

export function useReportAndBlock() {
  const report = useReportReview();
  const block = useBlockToggle();
  const user = useCurrentUser();

  async function reportAndBlock(
    reviewId: number,
    reviewUserId: string,
    reason: (typeof REPORT_REASONS)[number]
  ) {
    if (!user) {
      Alert.alert("로그인이 필요합니다.");
      return;
    }
    if (user.id === reviewUserId) {
      Alert.alert("알림", "자신의 리뷰는 신고/차단할 수 없습니다.");
      return;
    }

    // 병렬 실행
    await Promise.allSettled([
      report.mutateAsync({ reviewId, reviewUserId, reason }),
      block.mutateAsync({ blockedUserId: reviewUserId }),
    ]);
  }

  return {
    reportAndBlock,
    isPending: report.isPending || block.isPending,
  };
}
