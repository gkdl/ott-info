import { supabase } from "@/lib/supabase";
import type { InsertDto } from "@/types/database";

// ─── 신고 사유 ────────────────────────────────────────────────────────────────

export const REPORT_REASONS = [
  "욕설/혐오 표현",
  "스팸/광고",
  "개인정보 노출",
  "허위 정보",
  "기타",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

// ─── 신고 저장 ────────────────────────────────────────────────────────────────

export interface ReportInput {
  reporterId: string;
  reviewId: number;
  reviewUserId: string;  // 자기 신고 방지 검증용
  reason: ReportReason;
}

export type ReportResult =
  | { status: "success" }
  | { status: "self_report" }
  | { status: "duplicate" }
  | { status: "error"; message: string };

export async function reportReview(input: ReportInput): Promise<ReportResult> {
  // 자기 자신 신고 방지 (클라이언트 1차 — DB CHECK는 reporter_id ≠ review.user_id
  // 가 아닌 blocker ≠ blocked 패턴이므로 여기서 직접 체크)
  if (input.reporterId === input.reviewUserId) {
    return { status: "self_report" };
  }

  const payload: InsertDto<"reports"> = {
    reporter_id: input.reporterId,
    review_id: input.reviewId,
    reason: input.reason,
  };

  const { error } = await supabase.from("reports").insert(payload);

  if (error) {
    // (reporter_id, review_id) unique 제약 위반 → 이미 신고한 리뷰
    if (error.code === "23505") return { status: "duplicate" };
    return { status: "error", message: error.message };
  }

  return { status: "success" };
}

// ─── 차단 토글 ────────────────────────────────────────────────────────────────
// DB CHECK (blocker_id <> blocked_user_id) 로 자기 차단을 DB 레벨에서도 방지.
// 클라이언트에서 먼저 체크하여 불필요한 네트워크 요청을 차단.

export interface BlockInput {
  blockerId: string;
  blockedUserId: string;
}

export type BlockResult =
  | { status: "blocked" }
  | { status: "unblocked" }
  | { status: "self_block" }
  | { status: "error"; message: string };

export async function toggleBlock(input: BlockInput): Promise<BlockResult> {
  if (input.blockerId === input.blockedUserId) {
    return { status: "self_block" };
  }

  // 현재 차단 여부 확인
  const { data: existing } = await supabase
    .from("blocks")
    .select("id")
    .eq("blocker_id", input.blockerId)
    .eq("blocked_user_id", input.blockedUserId)
    .maybeSingle();

  if (existing) {
    // 차단 해제
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("id", existing.id);
    if (error) return { status: "error", message: error.message };
    return { status: "unblocked" };
  }

  // 차단 추가 — (blocker_id, blocked_user_id) unique + CHECK 제약
  const { error } = await supabase.from("blocks").insert({
    blocker_id: input.blockerId,
    blocked_user_id: input.blockedUserId,
  });

  if (error) {
    // 23505: unique violation (멱등 — 이미 차단됨)
    if (error.code === "23505") return { status: "blocked" };
    // 23514: check violation (자기 차단 시도 — DB 레벨에서 이중 방어)
    if (error.code === "23514") return { status: "self_block" };
    return { status: "error", message: error.message };
  }

  return { status: "blocked" };
}

// ─── 차단 목록 조회 (초기 로드용, useAuthInit에서 호출) ──────────────────────

export async function fetchBlockedUserIds(blockerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_user_id")
    .eq("blocker_id", blockerId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((b) => b.blocked_user_id);
}
