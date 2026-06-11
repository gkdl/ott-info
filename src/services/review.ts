import { supabase } from "@/lib/supabase";
import { filterContent, FILTER_MESSAGES } from "@/lib/contentFilter";
import type { InsertDto, UpdateDto, ReviewWithProfile } from "@/types/database";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

export const PAGE_SIZE = 10;

export type ReviewSort = "latest" | "likes" | "rating_high" | "rating_low";

// ─── 리뷰 목록 조회 (차단 유저 제외 RPC) ─────────────────────────────────────
// RLS SELECT 정책에 blocks 스캔을 넣지 않고 SECURITY DEFINER RPC로 분리.
// 이유: RLS에 blocks JOIN을 넣으면 모든 SELECT마다 blocks 풀스캔이 발생하여
// 인덱스 활용이 어렵고 정책 복잡도가 높아짐. RPC는 호출 시에만 실행되고
// 내부에서 최적화된 쿼리를 직접 작성할 수 있어 성능·유지보수가 모두 유리.

export interface FetchReviewsParams {
  contentId: string;
  contentType: "movie" | "tv";
  sort: ReviewSort;
  page: number;
}

export async function fetchReviews(
  params: FetchReviewsParams
): Promise<ReviewWithProfile[]> {
  const { data, error } = await supabase.rpc(
    "get_reviews_excluding_blocked",
    {
      p_content_id: params.contentId,
      p_content_type: params.contentType,
      p_sort: params.sort,
      p_limit: PAGE_SIZE,
      p_offset: (params.page - 1) * PAGE_SIZE,
    }
  );

  if (error) throw new Error(error.message);
  return (data ?? []) as ReviewWithProfile[];
}

// ─── 리뷰 작성 ────────────────────────────────────────────────────────────────

export interface CreateReviewInput {
  userId: string;
  contentId: string;
  contentType: "movie" | "tv";
  contentTitle: string;
  posterPath: string | null;
  rating: number;
  comment: string;
}

export async function createReview(input: CreateReviewInput): Promise<void> {
  // 클라이언트 1차 필터
  const filterResult = filterContent(input.comment);
  if (!filterResult.passed) {
    throw new Error(FILTER_MESSAGES[filterResult.reason!]);
  }

  if (input.rating < 1 || input.rating > 5) {
    throw new Error("평점은 1~5 사이여야 합니다.");
  }
  if (input.comment.length > 1000) {
    throw new Error("리뷰는 1000자 이내로 작성해주세요.");
  }

  const payload: InsertDto<"reviews"> = {
    user_id: input.userId,
    content_id: input.contentId,
    content_type: input.contentType,
    content_title: input.contentTitle,
    poster_path: input.posterPath,
    rating: input.rating,
    comment: input.comment,
  };

  const { error } = await supabase.from("reviews").insert(payload);
  // DB 트리거(2차 필터)가 위반 시 check constraint 에러를 반환
  if (error) throw new Error(error.message);
}

// ─── 리뷰 수정 ────────────────────────────────────────────────────────────────

export interface UpdateReviewInput {
  reviewId: number;
  rating: number;
  comment: string;
}

export async function updateReview(input: UpdateReviewInput): Promise<void> {
  const filterResult = filterContent(input.comment);
  if (!filterResult.passed) {
    throw new Error(FILTER_MESSAGES[filterResult.reason!]);
  }

  if (input.rating < 1 || input.rating > 5) {
    throw new Error("평점은 1~5 사이여야 합니다.");
  }
  if (input.comment.length > 1000) {
    throw new Error("리뷰는 1000자 이내로 작성해주세요.");
  }

  const payload: UpdateDto<"reviews"> = {
    rating: input.rating,
    comment: input.comment,
  };

  const { error } = await supabase
    .from("reviews")
    .update(payload)
    .eq("id", input.reviewId);
  // RLS: auth.uid() = user_id 강제 — 타인 글 수정 시 0 rows affected (에러 없음)

  if (error) throw new Error(error.message);
}

// ─── 리뷰 삭제 ────────────────────────────────────────────────────────────────

export async function deleteReview(reviewId: number): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);
  // RLS: auth.uid() = user_id 강제

  if (error) throw new Error(error.message);
}

// ─── 내 리뷰 목록 (마이페이지) ───────────────────────────────────────────────

export async function fetchMyReviews(
  userId: string,
  page: number
): Promise<ReviewWithProfile[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profile:profiles(nickname, avatar_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...r, is_liked_by_me: false })) as unknown as ReviewWithProfile[];
}

// ─── 좋아요 토글 ──────────────────────────────────────────────────────────────
// like_count 는 DB 트리거(review_likes INSERT/DELETE 시 reviews.like_count 증감)로 관리.
// 클라이언트는 review_likes 행만 INSERT/DELETE 하면 됨.

export async function toggleLike(
  userId: string,
  reviewId: number,
  isLiked: boolean
): Promise<void> {
  if (isLiked) {
    // 좋아요 취소
    const { error } = await supabase
      .from("review_likes")
      .delete()
      .eq("user_id", userId)
      .eq("review_id", reviewId);
    if (error) throw new Error(error.message);
  } else {
    // 좋아요 추가 — (user_id, review_id) unique 제약으로 중복 방지
    const { error } = await supabase
      .from("review_likes")
      .insert({ user_id: userId, review_id: reviewId });
    // 이미 좋아요한 경우 unique violation → 멱등 처리
    if (error && error.code !== "23505") throw new Error(error.message);
  }
}

// ─── 커뮤니티 피드 (홈 화면) ─────────────────────────────────────────────────

export async function fetchCommunityFeed(limit = 4): Promise<ReviewWithProfile[]> {
  const { data, error } = await supabase.rpc(
    "get_community_feed_excluding_blocked",
    { p_limit: limit }
  );

  if (error) throw new Error(error.message);
  return (data ?? []) as ReviewWithProfile[];
}
