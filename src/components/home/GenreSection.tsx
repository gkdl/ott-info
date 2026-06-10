import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { ContentCarousel } from "./ContentCarousel";
import { useGenreList, useDiscoverByGenre } from "@/hooks/useTmdb";
import { CarouselSkeleton } from "@/components/shared/Skeleton";

// 홈에 노출할 장르 ID (영화 기준, TMDB 고정값)
const FEATURED_GENRE_IDS = [
  { id: 28,    label: "액션" },
  { id: 53,    label: "스릴러" },
  { id: 10749, label: "로맨스" },
  { id: 35,    label: "코미디" },
  { id: 27,    label: "공포" },
  { id: 878,   label: "SF" },
  { id: 18,    label: "드라마" },
];

export function GenreSection() {
  const [selectedGenreId, setSelectedGenreId] = useState(FEATURED_GENRE_IDS[0].id);
  const genreListQuery = useGenreList("movie");
  const discoverQuery = useDiscoverByGenre("movie", selectedGenreId);

  const currentLabel =
    FEATURED_GENRE_IDS.find((g) => g.id === selectedGenreId)?.label ?? "";

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>장르별 큐레이션</Text>

      {/* 장르 탭 칩 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {genreListQuery.isLoading
          ? FEATURED_GENRE_IDS.map((g) => (
              <View key={g.id} style={styles.chipSkeleton} />
            ))
          : FEATURED_GENRE_IDS.map((g) => (
              <Pressable
                key={g.id}
                style={[styles.chip, selectedGenreId === g.id && styles.chipActive]}
                onPress={() => setSelectedGenreId(g.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedGenreId === g.id && styles.chipTextActive,
                  ]}
                >
                  {g.label}
                </Text>
              </Pressable>
            ))}
      </ScrollView>

      {/* 선택된 장르 콘텐츠 */}
      {discoverQuery.isLoading ? (
        <CarouselSkeleton />
      ) : (
        <ContentCarousel
          title={`${currentLabel} 추천`}
          query={discoverQuery}
          defaultMediaType="movie"
        />
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
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "transparent",
  },
  chipActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  chipText: { color: "#9ca3af", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  chipSkeleton: {
    width: 60,
    height: 36,
    borderRadius: 20,
    backgroundColor: "#1f2937",
  },
});
