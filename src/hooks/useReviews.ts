import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import {
  fetchReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleLike,
  fetchMyReviews,
  fetchCommunityFeed,
  fetchCommunityFeedV2,
  fetchReplies,
  createReply,
  PAGE_SIZE,
  type ReviewSort,
  type CommunitySort,
  type CommunityContentType,
  type CreateReviewInput,
  type UpdateReviewInput,
  type CreateReplyInput,
} from "@/services/review";
import { useCurrentUser } from "@/store/authStore";
import type { ReviewWithProfile } from "@/types/database";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const reviewKeys = {
  all: ["reviews"] as const,
  list: (contentId: string, contentType: string, sort: ReviewSort) =>
    ["reviews", "list", contentId, contentType, sort] as const,
  replies: (reviewId: number) => ["reviews", "replies", reviewId] as const,
  myReviews: (userId: string) => ["reviews", "mine", userId] as const,
  communityFeed: () => ["reviews", "community-feed"] as const,
  communityFeedV2: (sort: CommunitySort, contentType: CommunityContentType) =>
    ["reviews", "community-feed-v2", sort, contentType] as const,
};

// ─── 리뷰 목록 (useInfiniteQuery + 차단 유저 제외 RPC) ───────────────────────

export function useReviews(
  contentId: string,
  contentType: "movie" | "tv",
  sort: ReviewSort
) {
  return useInfiniteQuery({
    queryKey: reviewKeys.list(contentId, contentType, sort),
    queryFn: ({ pageParam = 1 }) =>
      fetchReviews({ contentId, contentType, sort, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── 리뷰 작성 ────────────────────────────────────────────────────────────────

export function useCreateReview(contentId: string, contentType: "movie" | "tv") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: () => {
      // 해당 콘텐츠의 모든 정렬 캐시 무효화
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      Toast.show({ type: "success", text1: "리뷰가 등록되었습니다." });
    },
    onError: (err: Error) => {
      Alert.alert("리뷰 작성 실패", err.message);
    },
  });
}

// ─── 리뷰 수정 ────────────────────────────────────────────────────────────────

export function useUpdateReview(contentId: string, contentType: "movie" | "tv") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateReviewInput) => updateReview(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      Toast.show({ type: "success", text1: "리뷰가 수정되었습니다." });
    },
    onError: (err: Error) => {
      Alert.alert("리뷰 수정 실패", err.message);
    },
  });
}

// ─── 리뷰 삭제 ────────────────────────────────────────────────────────────────

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: number) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (err: Error) => {
      Alert.alert("리뷰 삭제 실패", err.message);
    },
  });
}

// ─── 좋아요 토글 (낙관적 업데이트) ──────────────────────────────────────────

interface LikeContext {
  queryKey: readonly unknown[];
  previousData: ReturnType<typeof useInfiniteQuery>["data"] | undefined;
}

export function useLikeToggle(
  contentId: string,
  contentType: "movie" | "tv",
  sort: ReviewSort
) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();

  return useMutation({
    mutationFn: ({
      reviewId,
      isLiked,
    }: {
      reviewId: number;
      isLiked: boolean;
    }) => {
      if (!user) throw new Error("로그인이 필요합니다.");
      return toggleLike(user.id, reviewId, isLiked);
    },

    onMutate: async ({ reviewId, isLiked }) => {
      const queryKey = reviewKeys.list(contentId, contentType, sort);
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      // 낙관적으로 like_count 및 is_liked_by_me 즉시 반영
      queryClient.setQueryData(
        queryKey,
        (old: { pages: ReviewWithProfile[][] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((review) => {
                if (review.id !== reviewId) return review;
                return {
                  ...review,
                  is_liked_by_me: !isLiked,
                  like_count: isLiked
                    ? Math.max(0, review.like_count - 1)
                    : review.like_count + 1,
                };
              })
            ),
          };
        }
      );

      return { queryKey, previousData } satisfies LikeContext;
    },

    onError: (_err, _vars, context) => {
      // 실패 시 이전 데이터로 롤백
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },

    onSettled: () => {
      // 서버 상태로 동기화
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list(contentId, contentType, sort),
      });
    },
  });
}

// ─── 내 리뷰 목록 (마이페이지) ───────────────────────────────────────────────

export function useMyReviews(userId: string) {
  return useInfiniteQuery({
    queryKey: reviewKeys.myReviews(userId),
    queryFn: ({ pageParam = 1 }) => fetchMyReviews(userId, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    enabled: !!userId,
  });
}

// ─── 답글 목록 ────────────────────────────────────────────────────────────────

export function useReplies(reviewId: number, enabled: boolean) {
  return useQuery({
    queryKey: reviewKeys.replies(reviewId),
    queryFn: () => fetchReplies(reviewId),
    enabled,
    staleTime: 60 * 1000,
  });
}

// ─── 답글 작성 ────────────────────────────────────────────────────────────────

export function useCreateReply(parentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReplyInput) => createReply(input),
    onSuccess: () => {
      // 해당 리뷰의 답글 캐시 무효화 + 부모 리뷰 reply_count 갱신
      queryClient.invalidateQueries({ queryKey: reviewKeys.replies(parentId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (err: Error) => {
      Alert.alert("답글 작성 실패", err.message);
    },
  });
}

// ─── 커뮤니티 피드 V2 (커뮤니티 탭) ─────────────────────────────────────────

export function useCommunityFeedV2(
  sort: CommunitySort,
  contentType: CommunityContentType
) {
  return useInfiniteQuery({
    queryKey: reviewKeys.communityFeedV2(sort, contentType),
    queryFn: ({ pageParam = 0 }) =>
      fetchCommunityFeedV2(20, pageParam as number, sort, contentType),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length * 20 : undefined,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── 커뮤니티 피드 (홈 화면) ─────────────────────────────────────────────────

export function useCommunityFeed() {
  return useInfiniteQuery({
    queryKey: reviewKeys.communityFeed(),
    queryFn: ({ pageParam = 0 }) =>
      fetchCommunityFeed(10, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.length * 10 : undefined,
    staleTime: 3 * 60 * 1000,
  });
}
