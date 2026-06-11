import React from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { FeedSkeleton } from "@/components/shared/Skeleton";
import { SectionError, EmptyView } from "@/components/shared/StateViews";
import { useCommunityFeed } from "@/hooks/useReviews";
import { useBlockStore } from "@/store/blockStore";
import type { ReviewWithProfile } from "@/types/database";

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={i < rating ? styles.starFilled : styles.starEmpty}>
          ★
        </Text>
      ))}
    </View>
  );
}

interface FeedCardProps {
  review: ReviewWithProfile;
}

function FeedCard({ review }: FeedCardProps) {
  const router = useRouter();
  const timeAgo = formatTimeAgo(review.created_at);

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/detail/[id]",
          params: { id: review.content_id, type: review.content_type },
        })
      }
    >
      {/* 유저 정보 */}
      <View style={styles.cardHeader}>
        <Image
          source={
            review.profile.avatar_url
              ? { uri: review.profile.avatar_url }
              : require("@/assets/default-avatar.png")
          }
          style={styles.avatar}
          cachePolicy="memory-disk"
          contentFit="cover"
        />
        <View style={styles.userInfo}>
          <Text style={styles.nickname} numberOfLines={1}>
            {review.profile.nickname}
          </Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
        <StarRating rating={review.rating} />
      </View>

      {/* 콘텐츠 제목 */}
      <Text style={styles.contentTitle} numberOfLines={1}>
        🎬 {review.content_title}
      </Text>

      {/* 리뷰 본문 */}
      <Text style={styles.comment} numberOfLines={3}>
        {review.comment}
      </Text>

      {/* 좋아요 수 */}
      {review.like_count > 0 && (
        <Text style={styles.likeCount}>♥ {review.like_count}</Text>
      )}
    </Pressable>
  );
}

export function CommunityFeed() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityFeed();
  const isBlocked = useBlockStore((s) => s.isBlocked);

  if (isLoading) return <FeedSkeleton />;
  if (isError) return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>커뮤니티 리뷰</Text>
      <SectionError onRetry={refetch} />
    </View>
  );

  // 차단 유저 리뷰 클라이언트에서 즉각 필터링 (RPC 재호출 전 선반영)
  const reviews = (data?.pages.flat() ?? []).filter(
    (r) => !isBlocked(r.user_id)
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>커뮤니티 리뷰</Text>

      {reviews.length === 0 ? (
        <EmptyView
          emoji="💬"
          title="아직 리뷰가 없어요"
          description="콘텐츠를 감상하고 첫 리뷰를 남겨보세요!"
        />
      ) : (
        <View style={styles.feedList}>
          {reviews.map((review) => (
            <FeedCard key={review.id} review={review} />
          ))}
          {hasNextPage && (
            <Pressable
              style={styles.loadMoreButton}
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <ActivityIndicator color="#6366f1" />
              ) : (
                <Text style={styles.loadMoreText}>리뷰 더 보기</Text>
              )}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  feedList: { gap: 0 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#111827",
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1f2937",
  },
  userInfo: { flex: 1, gap: 2 },
  nickname: { color: "#e5e7eb", fontSize: 13, fontWeight: "600" },
  timeAgo: { color: "#6b7280", fontSize: 11 },
  stars: { flexDirection: "row", gap: 1 },
  starFilled: { color: "#fbbf24", fontSize: 12 },
  starEmpty: { color: "#374151", fontSize: 12 },
  contentTitle: { color: "#6366f1", fontSize: 12, fontWeight: "600" },
  comment: { color: "#9ca3af", fontSize: 13, lineHeight: 20 },
  likeCount: { color: "#6b7280", fontSize: 12 },
  loadMoreButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
  },
  loadMoreText: { color: "#9ca3af", fontSize: 14 },
});
