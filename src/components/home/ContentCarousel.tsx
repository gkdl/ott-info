import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { PosterImage } from "@/components/ui/CachedImage";
import { CarouselSkeleton } from "@/components/shared/Skeleton";
import { SectionError } from "@/components/shared/StateViews";
import { getContentInfo } from "@/lib/tmdbContent";
import type { TmdbPaginatedResult, TmdbContent } from "@/types/tmdb";

// useQuery 결과뿐 아니라 직접 합성한 결과(예: 영화+드라마 병합)도 받을 수 있도록 구조적 타입.
// 실제 UseQueryResult 도 이 형태를 만족한다.
export interface CarouselQuery {
  data?: TmdbPaginatedResult<TmdbContent>;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

interface ContentCarouselProps {
  title: string;
  query: CarouselQuery;
  defaultMediaType?: "movie" | "tv";
  showRank?: boolean;
}

export function ContentCarousel({
  title,
  query,
  defaultMediaType = "movie",
  showRank = false,
}: ContentCarouselProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = query;

  if (isLoading) return <CarouselSkeleton />;
  if (isError) return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <SectionError onRetry={refetch} />
    </View>
  );

  const items = data?.results.slice(0, 15) ?? [];
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.media_type ?? ""}-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        // 순위 표시 시 숫자가 포스터 밖으로 삐져나오므로 좌측 여백 조정
        contentContainerStyle={[styles.list, showRank && styles.listWithRank]}
        ItemSeparatorComponent={() => (
          <View style={{ width: showRank ? 4 : 12 }} />
        )}
        renderItem={({ item, index }) => {
          const { title: itemTitle, mediaType } = getContentInfo(item, defaultMediaType);
          return (
            <Pressable
              style={[styles.card, showRank && styles.cardWithRank]}
              onPress={() =>
                router.push({
                  pathname: "/detail/[id]",
                  params: { id: item.id, type: mediaType },
                })
              }
            >
              {/* 포스터 + 순위 숫자 */}
              <View style={styles.posterWrapper}>
                <PosterImage path={item.poster_path} width={showRank ? 100 : 120} />
                {showRank && (
                  <Text style={styles.rank}>{index + 1}</Text>
                )}
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {itemTitle}
              </Text>
              {item.vote_average > 0 && (
                <Text style={styles.cardRating}>
                  ★ {item.vote_average.toFixed(1)}
                </Text>
              )}
            </Pressable>
          );
        }}
      />
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
  list: { paddingHorizontal: 16 },
  listWithRank: { paddingHorizontal: 16, paddingBottom: 4 },
  card: { width: 120, gap: 6 },
  cardWithRank: { width: 116 },
  posterWrapper: { position: "relative" },
  rank: {
    position: "absolute",
    bottom: -8,
    left: -10,
    fontSize: 56,
    fontWeight: "900",
    color: "#fff",
    // 윤곽선 효과: 검정 테두리로 가독성 확보
    textShadowColor: "#000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    lineHeight: 56,
    letterSpacing: -4,
  },
  cardTitle: { color: "#e5e7eb", fontSize: 12, lineHeight: 16 },
  cardRating: { color: "#fbbf24", fontSize: 11, fontWeight: "600" },
});
