import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BackdropImage } from "@/components/ui/CachedImage";
import { HeroBannerSkeleton } from "@/components/shared/Skeleton";
import { SectionError } from "@/components/shared/StateViews";
import { useTrending } from "@/hooks/useTmdb";
import { useFavoriteToggle, useFavoriteStatus } from "@/hooks/useFavorite";
import { useCurrentUser } from "@/store/authStore";
import type { TmdbContent, TmdbMovie, TmdbTv } from "@/types/tmdb";

function getContentInfo(item: TmdbContent) {
  const isMovie = item.media_type === "movie" || "title" in item;
  const title = isMovie ? (item as TmdbMovie).title : (item as TmdbTv).name;
  const mediaType = (item.media_type ?? (isMovie ? "movie" : "tv")) as "movie" | "tv";
  return { title, mediaType };
}

export function HeroBanner() {
  const router = useRouter();
  const user = useCurrentUser();
  const { data, isLoading, isError, refetch } = useTrending("all", "week");

  const hero = data?.results[0];
  const { title, mediaType } = hero ? getContentInfo(hero) : { title: "", mediaType: "movie" as const };

  const favoriteStatus = useFavoriteStatus(
    String(hero?.id ?? 0),
    mediaType
  );
  const favoriteToggle = useFavoriteToggle(
    String(hero?.id ?? 0),
    mediaType
  );

  if (isLoading) return <HeroBannerSkeleton />;
  if (isError) return <SectionError onRetry={refetch} />;
  if (!hero) return null;

  const genreText = hero.vote_average > 0
    ? `⭐ ${hero.vote_average.toFixed(1)}`
    : "";

  function handleFavorite() {
    if (!user || !hero) return;
    favoriteToggle.mutate({
      userId: user.id,
      contentId: String(hero.id),
      contentType: mediaType,
      title,
      posterPath: hero.poster_path,
    });
  }

  return (
    <View style={styles.container}>
      <BackdropImage
        path={hero.backdrop_path}
        height={480}
        style={styles.backdrop}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.95)"]}
        style={StyleSheet.absoluteFill}
        locations={[0.3, 0.65, 1]}
      />

      <View style={styles.content}>
        {/* 배지 */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔥 지금 인기 1위</Text>
        </View>

        {/* 제목 */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* 평점 */}
        {genreText ? (
          <Text style={styles.meta}>{genreText}</Text>
        ) : null}

        {/* 액션 버튼 */}
        <View style={styles.actions}>
          <Pressable
            style={styles.detailButton}
            onPress={() =>
              router.push({
                pathname: "/detail/[id]",
                params: { id: hero.id, type: mediaType },
              })
            }
          >
            <Text style={styles.detailButtonText}>▶ 상세보기</Text>
          </Pressable>

          <Pressable
            style={[
              styles.favoriteButton,
              favoriteStatus.data && styles.favoriteButtonActive,
            ]}
            onPress={handleFavorite}
            disabled={!user || favoriteToggle.isPending}
          >
            <Text style={styles.favoriteIcon}>
              {favoriteStatus.data ? "★" : "☆"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", height: 480, position: "relative" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0 },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    gap: 8,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(99,102,241,0.85)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", lineHeight: 34 },
  meta: { color: "#d1d5db", fontSize: 14 },
  actions: { flexDirection: "row", gap: 12, marginTop: 8, alignItems: "center" },
  detailButton: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  detailButtonText: { color: "#000", fontWeight: "700", fontSize: 15 },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteButtonActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  favoriteIcon: { color: "#fff", fontSize: 22 },
});
