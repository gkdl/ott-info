import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { PosterImage } from "@/components/ui/CachedImage";
import { useSimilar } from "@/hooks/useTmdb";
import { getContentInfo } from "@/lib/tmdbContent";
import type { MediaType } from "@/types/tmdb";

interface SimilarContentProps {
  contentId: number;
  mediaType: MediaType;
}

export function SimilarContent({ contentId, mediaType }: SimilarContentProps) {
  const router = useRouter();
  const { data, isLoading } = useSimilar(mediaType, contentId);

  const items = data?.results.slice(0, 12) ?? [];
  if (!isLoading && items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>비슷한 콘텐츠</Text>
      {isLoading ? (
        // 스켈레톤 효과 — 빈 카드 3개
        <View style={styles.skeletonRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => {
            const { title, mediaType: itemType } = getContentInfo(item, mediaType);
            return (
              <Pressable
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/detail/[id]",
                    params: { id: item.id, type: itemType },
                  })
                }
              >
                <PosterImage path={item.poster_path} width={100} />
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {title}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  list: { paddingHorizontal: 16 },
  card: { width: 100, gap: 6 },
  cardTitle: { color: "#e5e7eb", fontSize: 11, lineHeight: 15 },
  cardRating: { color: "#fbbf24", fontSize: 10, fontWeight: "600" },
  skeletonRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
  },
  skeletonCard: {
    width: 100,
    height: 150,
    backgroundColor: "#111827",
    borderRadius: 8,
  },
});
