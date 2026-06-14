import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  type ListRenderItemInfo,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BackdropImage } from "@/components/ui/CachedImage";
import { HeroBannerSkeleton } from "@/components/shared/Skeleton";
import { SectionError } from "@/components/shared/StateViews";
import { useTrending } from "@/hooks/useTmdb";
import { useFavoriteToggle, useFavoriteStatus } from "@/hooks/useFavorite";
import { useCurrentUser } from "@/store/authStore";
import { getContentInfo } from "@/lib/tmdbContent";
import type { TmdbContent } from "@/types/tmdb";

const SLIDE_COUNT = 5;
const AUTO_ADVANCE_MS = 5000;

// ─── 개별 슬라이드 ────────────────────────────────────────────────────────────
// 즐겨찾기 훅을 슬라이드마다 호출하기 위해 컴포넌트로 분리

interface BannerSlideProps {
  item: TmdbContent;
  index: number;
  width: number;
}

function BannerSlide({ item, index, width }: BannerSlideProps) {
  const router = useRouter();
  const user = useCurrentUser();
  const { title, mediaType } = getContentInfo(item);

  const favoriteStatus = useFavoriteStatus(String(item.id), mediaType);
  const favoriteToggle = useFavoriteToggle(String(item.id), mediaType);

  function handleFavorite() {
    if (!user) {
      router.push("/login");
      return;
    }
    favoriteToggle.mutate({
      userId: user.id,
      contentId: String(item.id),
      contentType: mediaType,
      title,
      posterPath: item.poster_path,
    });
  }

  const rankLabel = index === 0 ? "🔥 인기 1위" : `TOP ${index + 1}`;

  return (
    <View style={[styles.slide, { width }]}>
      <BackdropImage
        path={item.backdrop_path}
        height={480}
        style={StyleSheet.absoluteFill as never}
      />
      <LinearGradient
        colors={["transparent", "rgba(3,7,18,0.6)", "rgba(3,7,18,0.97)"]}
        style={StyleSheet.absoluteFill}
        locations={[0.25, 0.6, 1]}
      />

      <View style={styles.content}>
        {/* 순위 배지 */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{rankLabel}</Text>
        </View>

        {/* 미디어 타입 */}
        <Text style={styles.mediaType}>
          {mediaType === "tv" ? "드라마" : "영화"}
        </Text>

        {/* 제목 */}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>

        {/* 평점 */}
        {item.vote_average > 0 && (
          <Text style={styles.meta}>
            {"★".repeat(Math.round(item.vote_average / 2))}
            {"☆".repeat(5 - Math.round(item.vote_average / 2))}
            {"  "}{item.vote_average.toFixed(1)}
          </Text>
        )}

        {/* 버튼 */}
        <View style={styles.actions}>
          <Pressable
            style={styles.detailButton}
            onPress={() =>
              router.push({
                pathname: "/detail/[id]",
                params: { id: item.id, type: mediaType },
              })
            }
          >
            <Text style={styles.detailButtonText}>▶  상세보기</Text>
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

// ─── 도트 인디케이터 ──────────────────────────────────────────────────────────

function DotIndicator({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === active && styles.dotActive]}
        />
      ))}
    </View>
  );
}

// ─── 메인 배너 ────────────────────────────────────────────────────────────────

export function HeroBanner() {
  const { width } = useWindowDimensions();
  const { data, isLoading, isError, refetch } = useTrending("all", "week");

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<TmdbContent>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const items = data?.results.slice(0, SLIDE_COUNT) ?? [];

  // 자동 넘김
  const advance = useCallback(() => {
    setActiveIndex((prev) => {
      const next = (prev + 1) % Math.max(items.length, 1);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      return next;
    });
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    timerRef.current = setInterval(advance, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advance, items.length]);

  // 수동 스크롤 시 타이머 리셋
  function handleScrollEnd(e: { nativeEvent: { contentOffset: { x: number } } }) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, AUTO_ADVANCE_MS);
  }

  if (isLoading) return <HeroBannerSkeleton />;
  if (isError) return <SectionError onRetry={refetch} />;
  if (items.length === 0) return null;

  return (
    <View style={[styles.container, { height: 480 }]}>
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item, index }: ListRenderItemInfo<TmdbContent>) => (
          <BannerSlide item={item} index={index} width={width} />
        )}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* 도트 인디케이터 */}
      <DotIndicator count={items.length} active={activeIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  slide: { height: 480, position: "relative", overflow: "hidden" },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 48,
    gap: 6,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(99,102,241,0.9)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 2,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  mediaType: { color: "#9ca3af", fontSize: 12, fontWeight: "600", letterSpacing: 1 },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", lineHeight: 32 },
  meta: { color: "#fbbf24", fontSize: 13, letterSpacing: 1 },
  actions: { flexDirection: "row", gap: 12, marginTop: 10, alignItems: "center" },
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
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteButtonActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  favoriteIcon: { color: "#fff", fontSize: 22 },
  // 도트
  dots: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    width: 20,
    backgroundColor: "#fff",
  },
});
