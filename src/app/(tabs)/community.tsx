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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReviewFeedCard } from "@/components/community/ReviewFeedCard";
import { EmptyView, SectionError } from "@/components/shared/StateViews";
import { FeedSkeleton } from "@/components/shared/Skeleton";
import { useCommunityReviews } from "@/hooks/useReviews";
import { useBlockStore } from "@/store/blockStore";
import type { ReviewWithProfile } from "@/types/database";
import type { CommunitySort, CommunityType } from "@/services/review";

const SORT_OPTIONS: { label: string; value: CommunitySort }[] = [
  { label: "최신", value: "latest" },
  { label: "인기", value: "popular" },
];

const TYPE_OPTIONS: { label: string; value: CommunityType }[] = [
  { label: "전체", value: "all" },
  { label: "영화", value: "movie" },
  { label: "TV", value: "tv" },
];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<CommunitySort>("latest");
  const [contentType, setContentType] = useState<CommunityType>("all");
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
  } = useCommunityReviews(sort, contentType);

  const reviews = (data?.pages.flat() ?? []).filter((r) => !isBlocked(r.user_id));

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: ReviewWithProfile }) => <ReviewFeedCard review={item} />,
    []
  );

  const keyExtractor = useCallback((item: ReviewWithProfile) => String(item.id), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
        <Text style={styles.headerSub}>다른 사람들의 영화·드라마 리뷰</Text>
      </View>

      {/* 필터 행 */}
      <View style={styles.filterRow}>
        <View style={styles.segmentGroup}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.segmentBtn, sort === opt.value && styles.segmentBtnActive]}
              onPress={() => setSort(opt.value)}
            >
              <Text
                style={[styles.segmentLabel, sort === opt.value && styles.segmentLabelActive]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.chipGroup}>
          {TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.chip, contentType === opt.value && styles.chipActive]}
              onPress={() => setContentType(opt.value)}
            >
              <Text
                style={[styles.chipLabel, contentType === opt.value && styles.chipLabelActive]}
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
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#6366f1" style={{ paddingVertical: 16 }} />
            ) : null
          }
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },

  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { color: "#f9fafb", fontSize: 22, fontWeight: "700" },
  headerSub: { color: "#6b7280", fontSize: 13, marginTop: 2 },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },

  // 정렬 세그먼트
  segmentGroup: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentBtnActive: { backgroundColor: "#6366f1" },
  segmentLabel: { color: "#9ca3af", fontSize: 13, fontWeight: "600" },
  segmentLabelActive: { color: "#fff" },

  // 타입 칩
  chipGroup: { flexDirection: "row", gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  chipActive: { backgroundColor: "#312e81", borderColor: "#6366f1" },
  chipLabel: { color: "#9ca3af", fontSize: 12, fontWeight: "600" },
  chipLabelActive: { color: "#c7d2fe" },

  listContent: { paddingTop: 4, paddingBottom: 16 },
});
