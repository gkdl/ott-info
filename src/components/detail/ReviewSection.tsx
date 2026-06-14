import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ReviewForm } from "./ReviewForm";
import { ReviewCard } from "./ReviewCard";
import { CarouselSkeleton } from "@/components/shared/Skeleton";
import { EmptyView, SectionError } from "@/components/shared/StateViews";
import { useReviews } from "@/hooks/useReviews";
import { useCurrentUser } from "@/store/authStore";
import type { ReviewSort } from "@/services/review";
import type { ReviewWithProfile } from "@/types/database";

const SORT_OPTIONS: { label: string; value: ReviewSort }[] = [
  { label: "최신순",     value: "latest" },
  { label: "좋아요순",   value: "likes" },
  { label: "평점 높은순", value: "rating_high" },
  { label: "평점 낮은순", value: "rating_low" },
];

interface ReviewSectionProps {
  contentId: string;
  contentType: "movie" | "tv";
  contentTitle: string;
  posterPath: string | null;
}

export function ReviewSection({
  contentId,
  contentType,
  contentTitle,
  posterPath,
}: ReviewSectionProps) {
  const user = useCurrentUser();
  const router = useRouter();
  const [sort, setSort] = useState<ReviewSort>("latest");
  const [editingReview, setEditingReview] = useState<ReviewWithProfile | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReviews(contentId, contentType, sort);

  const allReviews = data?.pages.flat() ?? [];
  // 본인 리뷰가 이미 있으면 작성 폼 숨김 (수정 폼으로 대체)
  const myReview = user
    ? allReviews.find((r) => r.user_id === user.id) ?? null
    : null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>리뷰</Text>

      {/* 비로그인(게스트): 로그인 유도 */}
      {!user && (
        <Pressable style={styles.loginPrompt} onPress={() => router.push("/login")}>
          <Text style={styles.loginPromptText}>로그인하고 리뷰 작성하기</Text>
        </Pressable>
      )}

      {/* 리뷰 작성 폼 — 비로그인이거나 본인 리뷰가 있을 때 숨김 */}
      {user && !myReview && !editingReview && (
        <ReviewForm
          contentId={contentId}
          contentType={contentType}
          contentTitle={contentTitle}
          posterPath={posterPath}
        />
      )}

      {/* 수정 폼 */}
      {editingReview && (
        <ReviewForm
          contentId={contentId}
          contentType={contentType}
          contentTitle={contentTitle}
          posterPath={posterPath}
          existingReview={editingReview}
          onDone={() => setEditingReview(null)}
        />
      )}

      {/* 정렬 탭 */}
      <View style={styles.sortBar}>
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.sortChip, sort === opt.value && styles.sortChipActive]}
            onPress={() => setSort(opt.value)}
          >
            <Text
              style={[
                styles.sortChipText,
                sort === opt.value && styles.sortChipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 리뷰 목록 */}
      {isLoading ? (
        <CarouselSkeleton count={2} />
      ) : isError ? (
        <SectionError onRetry={refetch} />
      ) : allReviews.length === 0 ? (
        <EmptyView
          emoji="✍️"
          title="아직 리뷰가 없어요"
          description="이 작품의 첫 번째 리뷰를 작성해보세요!"
        />
      ) : (
        <>
          {allReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              contentId={contentId}
              contentType={contentType}
              sort={sort}
              onEditRequest={(r) => setEditingReview(r)}
            />
          ))}

          {/* 더 보기 */}
          {hasNextPage && (
            <Pressable
              style={styles.loadMoreButton}
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Text style={styles.loadMoreText}>리뷰 더 보기</Text>
              )}
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  sectionTitle: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  sortBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    flexWrap: "wrap",
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  sortChipActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  loginPrompt: {
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
  },
  loginPromptText: { color: "#9ca3af", fontSize: 14, fontWeight: "600" },
  sortChipText: { color: "#9ca3af", fontSize: 12, fontWeight: "600" },
  sortChipTextActive: { color: "#fff" },
  loadMoreButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
  },
  loadMoreText: { color: "#9ca3af", fontSize: 14 },
});
