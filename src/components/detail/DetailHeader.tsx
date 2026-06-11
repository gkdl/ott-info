import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BackdropImage, PosterImage } from "@/components/ui/CachedImage";
import { SkeletonBox } from "@/components/shared/Skeleton";
import type { TmdbMovieDetail, TmdbTvDetail } from "@/types/tmdb";

type ContentDetail = TmdbMovieDetail | TmdbTvDetail;

function isMovie(d: ContentDetail): d is TmdbMovieDetail {
  return "title" in d;
}

interface DetailHeaderProps {
  detail: ContentDetail;
  isFavorited: boolean;
  isFavoritePending: boolean;
  onFavoriteToggle: () => void;
}

export function DetailHeader({
  detail,
  isFavorited,
  isFavoritePending,
  onFavoriteToggle,
}: DetailHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const title = isMovie(detail) ? detail.title : detail.name;
  const runtime = isMovie(detail)
    ? detail.runtime
      ? `${detail.runtime}분`
      : null
    : detail.episode_run_time?.[0]
    ? `회당 ${detail.episode_run_time[0]}분`
    : null;
  const releaseYear = isMovie(detail)
    ? detail.release_date?.slice(0, 4)
    : detail.first_air_date?.slice(0, 4);
  const genreNames = detail.genres?.map((g) => g.name).join(" · ") ?? "";

  return (
    <View>
      {/* 백드롭 */}
      <View style={{ height: 320, position: "relative" }}>
        <BackdropImage path={detail.backdrop_path} height={320} />
        <LinearGradient
          colors={["rgba(0,0,0,0.1)", "rgba(3,7,18,1)"]}
          style={StyleSheet.absoluteFill}
          locations={[0.4, 1]}
        />

        {/* 뒤로 가기 */}
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { top: insets.top + 8 }]}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* 포스터 + 기본 정보 */}
      <View style={styles.infoRow}>
        <PosterImage path={detail.poster_path} width={100} />

        <View style={styles.metaColumn}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.badges}>
            {releaseYear && (
              <Text style={styles.badge}>{releaseYear}</Text>
            )}
            {runtime && (
              <Text style={styles.badge}>{runtime}</Text>
            )}
            <Text style={[styles.badge, styles.ratingBadge]}>
              ⭐ {detail.vote_average.toFixed(1)}
            </Text>
          </View>

          {genreNames ? (
            <Text style={styles.genre} numberOfLines={2}>
              {genreNames}
            </Text>
          ) : null}

          {/* 즐겨찾기 버튼 */}
          <Pressable
            style={[
              styles.favoriteButton,
              isFavorited && styles.favoriteButtonActive,
            ]}
            onPress={onFavoriteToggle}
            disabled={isFavoritePending}
          >
            <Text style={styles.favoriteButtonText}>
              {isFavorited ? "★ 즐겨찾기 해제" : "☆ 즐겨찾기 추가"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 줄거리 */}
      {detail.overview ? (
        <View style={styles.overviewSection}>
          <Text style={styles.overviewLabel}>줄거리</Text>
          <Text style={styles.overview}>{detail.overview}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function DetailHeaderSkeleton() {
  return (
    <View>
      <SkeletonBox style={{ height: 320, borderRadius: 0 }} />
      <View style={[styles.infoRow, { alignItems: "flex-start" }]}>
        <SkeletonBox style={{ width: 100, height: 150, borderRadius: 8 }} />
        <View style={{ flex: 1, gap: 10, paddingTop: 4 }}>
          <SkeletonBox style={{ height: 22, width: "80%", borderRadius: 6 }} />
          <SkeletonBox style={{ height: 16, width: "50%", borderRadius: 4 }} />
          <SkeletonBox style={{ height: 14, width: "60%", borderRadius: 4 }} />
          <SkeletonBox style={{ height: 38, width: 140, borderRadius: 8 }} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 8, marginTop: 4 }}>
        <SkeletonBox style={{ height: 16, width: "40%", borderRadius: 4 }} />
        <SkeletonBox style={{ height: 14, width: "100%", borderRadius: 4 }} />
        <SkeletonBox style={{ height: 14, width: "90%", borderRadius: 4 }} />
        <SkeletonBox style={{ height: 14, width: "70%", borderRadius: 4 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    marginTop: -48,
    alignItems: "flex-end",
  },
  metaColumn: { flex: 1, gap: 8, paddingBottom: 4 },
  title: { color: "#f9fafb", fontSize: 20, fontWeight: "800", lineHeight: 26 },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  badge: {
    color: "#9ca3af",
    fontSize: 12,
    backgroundColor: "#1f2937",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingBadge: { color: "#fbbf24" },
  genre: { color: "#6b7280", fontSize: 12, lineHeight: 18 },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  favoriteButtonActive: {
    backgroundColor: "#312e81",
    borderColor: "#6366f1",
  },
  favoriteButtonText: { color: "#e5e7eb", fontSize: 13, fontWeight: "600" },
  overviewSection: { paddingHorizontal: 16, paddingTop: 20, gap: 8 },
  overviewLabel: { color: "#f9fafb", fontSize: 16, fontWeight: "700" },
  overview: { color: "#9ca3af", fontSize: 14, lineHeight: 22 },
});
