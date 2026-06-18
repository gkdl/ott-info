import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCommunityFeedV2 } from "@/hooks/useReviews";
import { useBlockStore } from "@/store/blockStore";
import { CachedImage } from "@/components/ui/CachedImage";
import { EmptyView, SectionError } from "@/components/shared/StateViews";
import { FeedSkeleton } from "@/components/shared/Skeleton";
import type { ReviewWithProfile } from "@/types/database";
import type { CommunitySort, CommunityContentType } from "@/services/review";

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function FeedCard({ review }: { review: ReviewWithProfile }) {
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
      <CachedImage path={review.poster_path} size="thumb" style={styles.poster} />
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.mediaIcon}>{mediaIcon}</Text>
          <Text style={styles.contentTitle} numberOfLines={1}>
            {review.content_title}
          </Text>
        </View>
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
        <Text style={styles.comment} numberOfLines={2}>
          {review.comment}
        </Text>
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

// ─── Main Screen ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: { label: string; value: CommunitySort }[] = [
  { label: "최신", value: "latest" },
  { label: "인기", value: "popular" },
];

const TYPE_OPTIONS: { label: string; value: CommunityContentType }[] = [
  { label: "전체", value: "all" },
  { label: "영화", value: "movie" },
  { label: "TV", value: "tv" },
];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<CommunitySort>("latest");
  const [contentType, setContentType] = useState<CommunityContentType>("all");
  const isBlocked = useBlockStore((s) => s.isBlocked);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useCommunityFeedV2(sort, contentType);

  const reviews = (data?.pages.flat() ?? []).filter((r) => !isBlocked(r.user_id));

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: ReviewWithProfile }) => <FeedCard review={item} />,
    []
  );

  const keyExtractor = useCallback((item: ReviewWithProfile) => String(item.id), []);

  const ListFooter = isFetchingNextPage ? (
    <ActivityIndicator color="#6366f1" style={{ paddingVertical: 16 }} />
  ) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
      </View>

      {/* 필터 행 */}
      <View style={styles.filterRow}>
        {/* 정렬 토글 */}
        <View style={styles.segmentGroup}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.segmentBtn, sort === opt.value && styles.segmentBtnActive]}
              onPress={() => setSort(opt.value)}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  sort === opt.value && styles.segmentLabelActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 콘텐츠 타입 필터 */}
        <View style={styles.chipGroup}>
          {TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.chip, contentType === opt.value && styles.chipActive]}
              onPress={() => setContentType(opt.value)}
            >
              <Text
                style={[
                  styles.chipLabel,
                  contentType === opt.value && styles.chipLabelActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 피드 */}
      {isLoading ? (
        <FeedSkeleton />
      ) : isError ? (
        <SectionError onRetry={refetch} />
      ) : reviews.length === 0 ? (
        <EmptyView
          emoji="💬"
          title="아직 리뷰가 없어요"
          description="콘텐츠를 감상하고 첫 리뷰를 남겨보세요!"
        />
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#6366f1"
            />
          }
        />
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
  container: { flex: 1, backgroundColor: "#0f172a" },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "#f9fafb",
    fontSize: 22,
    fontWeight: "700",
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },

  segmentGroup: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentBtnActive: { backgroundColor: "#6366f1" },
  segmentLabel: { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  segmentLabelActive: { color: "#fff" },

  chipGroup: { flexDirection: "row", gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
  },
  chipActive: { borderColor: "#6366f1", backgroundColor: "#1e1b4b" },
  chipLabel: { color: "#6b7280", fontSize: 12, fontWeight: "600" },
  chipLabelActive: { color: "#818cf8" },

  listContent: { paddingVertical: 4 },

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
  cardBody: { flex: 1, gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  mediaIcon: { fontSize: 12 },
  contentTitle: { flex: 1, color: "#6366f1", fontSize: 13, fontWeight: "700" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  avatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#1f2937" },
  nickname: { flex: 1, color: "#9ca3af", fontSize: 11, fontWeight: "600" },
  stars: { flexDirection: "row", gap: 1 },
  starFilled: { color: "#fbbf24", fontSize: 10 },
  starEmpty: { color: "#374151", fontSize: 10 },
  comment: { color: "#d1d5db", fontSize: 13, lineHeight: 19 },
  footer: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  timeAgo: { color: "#4b5563", fontSize: 11 },
  likeCount: { color: "#6b7280", fontSize: 11 },
  replyCount: { color: "#6b7280", fontSize: 11 },
});
