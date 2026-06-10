import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { PosterImage } from "@/components/ui/CachedImage";
import { EmptyView, SectionError } from "@/components/shared/StateViews";
import { SkeletonBox } from "@/components/shared/Skeleton";
import { useMyReviews } from "@/hooks/useReviews";
import { useDeleteReview } from "@/hooks/useReviews";
import { useCurrentUser } from "@/store/authStore";
import type { ReviewWithProfile } from "@/types/database";

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={i < rating ? styles.starFilled : styles.starEmpty}>
          ★
        </Text>
      ))}
    </View>
  );
}

function MyReviewItem({ review }: { review: ReviewWithProfile }) {
  const router = useRouter();
  const deleteMutation = useDeleteReview();
  const [expanded, setExpanded] = useState(false);

  function handleDelete() {
    Alert.alert("리뷰 삭제", "이 리뷰를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteMutation.mutate(review.id),
      },
    ]);
  }

  return (
    <Pressable
      style={styles.reviewItem}
      onPress={() =>
        router.push({
          pathname: "/detail/[id]",
          params: { id: review.content_id, type: review.content_type },
        })
      }
    >
      {/* 포스터 + 내용 나란히 */}
      <PosterImage path={review.poster_path} width={56} />

      <View style={styles.reviewContent}>
        <Text style={styles.contentTitle} numberOfLines={1}>
          {review.content_title}
        </Text>
        <StarRow rating={review.rating} />
        <Text
          style={styles.comment}
          numberOfLines={expanded ? undefined : 2}
          onPress={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {review.comment}
        </Text>
        <Text style={styles.timeAgo}>{formatTimeAgo(review.created_at)}</Text>
      </View>

      {/* 삭제 버튼 */}
      <Pressable
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        disabled={deleteMutation.isPending}
        hitSlop={8}
      >
        <Text style={styles.deleteIcon}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

export function MyReviewList() {
  const user = useCurrentUser();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyReviews(user?.id ?? "");

  const reviews = data?.pages.flat() ?? [];

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내 리뷰</Text>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.reviewSkeletonRow}>
            <SkeletonBox style={{ width: 56, height: 84, borderRadius: 6 }} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBox style={{ height: 14, width: "70%", borderRadius: 4 }} />
              <SkeletonBox style={{ height: 12, width: "40%", borderRadius: 4 }} />
              <SkeletonBox style={{ height: 12, width: "90%", borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내 리뷰</Text>
        <SectionError onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>내 리뷰</Text>
        {reviews.length > 0 && (
          <Text style={styles.count}>{reviews.length}개</Text>
        )}
      </View>

      {reviews.length === 0 ? (
        <EmptyView
          emoji="✍️"
          title="아직 작성한 리뷰가 없어요"
          description="콘텐츠를 보고 리뷰를 남겨보세요."
        />
      ) : (
        <>
          {reviews.map((r) => (
            <MyReviewItem key={r.id} review={r} />
          ))}
          {hasNextPage && (
            <Pressable
              style={styles.loadMoreButton}
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Text style={styles.loadMoreText}>더 보기</Text>
              )}
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  sectionTitle: { color: "#f9fafb", fontSize: 16, fontWeight: "700" },
  count: { color: "#6b7280", fontSize: 13 },
  reviewItem: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1f2937",
    alignItems: "flex-start",
  },
  reviewContent: { flex: 1, gap: 5 },
  contentTitle: { color: "#e5e7eb", fontSize: 13, fontWeight: "600" },
  starRow: { flexDirection: "row", gap: 1 },
  starFilled: { color: "#fbbf24", fontSize: 11 },
  starEmpty: { color: "#374151", fontSize: 11 },
  comment: { color: "#9ca3af", fontSize: 13, lineHeight: 19 },
  timeAgo: { color: "#4b5563", fontSize: 11 },
  deleteButton: { paddingLeft: 8, paddingTop: 2 },
  deleteIcon: { color: "#4b5563", fontSize: 14 },
  reviewSkeletonRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
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
