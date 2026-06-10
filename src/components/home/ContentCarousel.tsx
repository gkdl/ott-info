import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { PosterImage } from "@/components/ui/CachedImage";
import { CarouselSkeleton } from "@/components/shared/Skeleton";
import { SectionError } from "@/components/shared/StateViews";
import type { UseQueryResult } from "@tanstack/react-query";
import type { TmdbPaginatedResult, TmdbContent, TmdbMovie, TmdbTv } from "@/types/tmdb";

interface ContentCarouselProps {
  title: string;
  query: UseQueryResult<TmdbPaginatedResult<TmdbContent>>;
  defaultMediaType?: "movie" | "tv";
}

function getItemInfo(item: TmdbContent, defaultMediaType: "movie" | "tv") {
  const isMovie =
    item.media_type === "movie" ||
    (item.media_type === undefined && "title" in item);
  const title = isMovie ? (item as TmdbMovie).title : (item as TmdbTv).name;
  const mediaType = (item.media_type ?? defaultMediaType) as "movie" | "tv";
  return { title, mediaType };
}

export function ContentCarousel({
  title,
  query,
  defaultMediaType = "movie",
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
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => {
          const { title: itemTitle, mediaType } = getItemInfo(item, defaultMediaType);
          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/detail/[id]",
                  params: { id: item.id, type: mediaType },
                })
              }
            >
              <PosterImage path={item.poster_path} width={120} />
              <Text style={styles.cardTitle} numberOfLines={2}>
                {itemTitle}
              </Text>
              {item.vote_average > 0 && (
                <Text style={styles.cardRating}>
                  ⭐ {item.vote_average.toFixed(1)}
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
  card: { width: 120, gap: 6 },
  cardTitle: { color: "#e5e7eb", fontSize: 12, lineHeight: 16 },
  cardRating: { color: "#9ca3af", fontSize: 11 },
});
