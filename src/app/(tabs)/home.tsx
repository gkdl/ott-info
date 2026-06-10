import React, { useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { HeroBanner } from "@/components/home/HeroBanner";
import { ContentCarousel } from "@/components/home/ContentCarousel";
import { GenreSection } from "@/components/home/GenreSection";
import { CommunityFeed } from "@/components/home/CommunityFeed";
import { OfflineBanner } from "@/components/shared/StateViews";
import { useNetworkState } from "@/hooks/useNetworkState";
import { useTrending, useTopRated, useUpcoming, useNowPlaying, tmdbKeys } from "@/hooks/useTmdb";
import { reviewKeys } from "@/hooks/useReviews";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkState();

  // 각 섹션 쿼리 (ContentCarousel에 query 객체 그대로 전달)
  const trendingQuery   = useTrending("all", "week");
  const topRatedQuery   = useTopRated("movie");
  const upcomingQuery   = useUpcoming("movie");
  const nowPlayingQuery = useNowPlaying("tv");

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: tmdbKeys.trending("all", "week") }),
      queryClient.invalidateQueries({ queryKey: tmdbKeys.topRated("movie") }),
      queryClient.invalidateQueries({ queryKey: tmdbKeys.upcoming("movie") }),
      queryClient.invalidateQueries({ queryKey: tmdbKeys.nowPlaying("tv") }),
      queryClient.invalidateQueries({ queryKey: reviewKeys.communityFeed() }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={["#6366f1"]}
          />
        }
      >
        {/* 오프라인 배너 */}
        {!isOnline && (
          <View style={styles.offlineBannerWrapper}>
            <OfflineBanner />
          </View>
        )}

        {/* 히어로 배너 — 오프셋 없이 최상단 */}
        <HeroBanner />

        {/* 섹션 간격 컨테이너 */}
        <View style={styles.sections}>

          {/* 트렌딩 */}
          <ContentCarousel
            title="🔥 지금 뜨는 콘텐츠"
            query={trendingQuery}
            defaultMediaType="movie"
          />

          <Divider />

          {/* Top Rated */}
          <ContentCarousel
            title="⭐ 역대 명작"
            query={topRatedQuery}
            defaultMediaType="movie"
          />

          <Divider />

          {/* 개봉 예정 */}
          <ContentCarousel
            title="🎟 개봉 예정작"
            query={upcomingQuery}
            defaultMediaType="movie"
          />

          <Divider />

          {/* 현재 방영 중 TV */}
          <ContentCarousel
            title="📺 지금 방영 중"
            query={nowPlayingQuery}
            defaultMediaType="tv"
          />

          <Divider />

          {/* 장르별 큐레이션 */}
          <GenreSection />

          <Divider />

          {/* 커뮤니티 피드 */}
          <CommunityFeed />

          {/* 하단 여백 */}
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  scroll: { flex: 1 },
  offlineBannerWrapper: { paddingTop: 8 },
  sections: { gap: 28, paddingTop: 24 },
  divider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: "#1f2937",
  },
});
