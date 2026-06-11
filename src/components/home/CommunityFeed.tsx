import React from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { FeedSkeleton } from "@/components/shared/Skeleton";
import { SectionError, EmptyView } from "@/components/shared/StateViews";
import { CachedImage } from "@/components/ui/CachedImage";
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
  const mediaIcon = review.content_type === "tv" ? "📺" : "🎬";

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
      {/* 좌측: 포스터 */}
      <CachedImage
        path={review.poster_path}
        size="thumb"
        style={styles.poster}
      />

      {/* 우측: 콘텐츠 */}
      <View style={styles.cardBody}>
        {/* 콘텐츠 제목 + 미디어 타입 */}
        <View style={styles.titleRow}>
          <Text style={styles.mediaIcon}>{mediaIcon}</Text>
          <Text style={styles.contentTitle} numberOfLines={1}>
            {review.content_title}
          </Text>
        </View>

        {/* 유저 정보 + 별점 */}
        <View style={styles.userRow}>
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
          <Text style={styles.nickname} numberOfLines={1}>
            {review.profile.nickname}
          </Text>
          <StarRating rating={review.rating} />
        </View>

        {/* 리뷰 본문 */}
        <Text style={styles.comment} numberOfLines={2}>
          {review.comment}
        </Text>

        {/* 하단: 시간 + 좋아요 */}
        <View style={styles.footer}>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
          {review.like_count > 0 && (
            <Text style={styles.likeCount}>♥ {review.like_count}</Text>
          )}
          {review.reply_count > 0 && (
            <Text style={styles.replyCount}>💬 {review.reply_count}</Text>
          )}
        </View>
      </View>
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
  return `${Math.floor(hours / 24)}일 전`;
}

const POSTER_W = 72;
const POSTER_H = Math.round(POSTER_W * 1.5);

const styles = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  feedList: { gap: 0 },

  // 카드
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#111827",
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  poster: {
    width: POSTER_W,
    height: POSTER_H,
    borderRadius: 8,
    backgroundColor: "#1f2937",
    flexShrink: 0,
  },

  // 우측 콘텐츠
  cardBody: { flex: 1, gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  mediaIcon: { fontSize: 12 },
  contentTitle: { flex: 1, color: "#6366f1", fontSize: 13, fontWeight: "700" },

  // 유저 행
  userRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1f2937",
  },
  nickname: { flex: 1, color: "#9ca3af", fontSize: 11, fontWeight: "600" },
  stars: { flexDirection: "row", gap: 1 },
  starFilled: { color: "#fbbf24", fontSize: 10 },
  starEmpty: { color: "#374151", fontSize: 10 },

  comment: { color: "#d1d5db", fontSize: 13, lineHeight: 19 },

  // 하단
  footer: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  timeAgo: { color: "#4b5563", fontSize: 11 },
  likeCount: { color: "#6b7280", fontSize: 11 },
  replyCount: { color: "#6b7280", fontSize: 11 },

  // 더보기
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
