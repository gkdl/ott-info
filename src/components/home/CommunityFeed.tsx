import React from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { FeedSkeleton } from "@/components/shared/Skeleton";
import { SectionError, EmptyView } from "@/components/shared/StateViews";
import { ReviewFeedCard } from "@/components/community/ReviewFeedCard";
import { useCommunityFeed } from "@/hooks/useReviews";
import { useBlockStore } from "@/store/blockStore";

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
            <ReviewFeedCard key={review.id} review={review} />
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

const styles = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  feedList: { gap: 0 },

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
