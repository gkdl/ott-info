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

      {/* 앱 타이틀 헤더 */}
      <View style={styles.appHeader}>
        <Text style={styles.appLogo}>▶</Text>
        <Text style={styles.appTitle}>OTT<Text style={styles.appTitleAccent}>INFO</Text></Text>
      </View>

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
        {!isOnline && (
          <View style={styles.offlineBannerWrapper}>
            <OfflineBanner />
          </View>
        )}

        <HeroBanner />

        <View style={styles.sections}>

          <ContentCarousel
            title="🔥 지금 뜨는 콘텐츠"
            query={trendingQuery}
            defaultMediaType="movie"
            showRank
          />

          <ContentCarousel
            title="★ 역대 명작"
            query={topRatedQuery}
            defaultMediaType="movie"
            showRank
          />

          <ContentCarousel
            title="🎟 개봉 예정작"
            query={upcomingQuery}
            defaultMediaType="movie"
          />

          <ContentCarousel
            title="📺 지금 방영 중"
            query={nowPlayingQuery}
            defaultMediaType="tv"
          />

          <GenreSection />

          <CommunityFeed />

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  appLogo: {
    fontSize: 18,
    color: "#6366f1",
    fontWeight: "900",
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f9fafb",
    letterSpacing: 0.5,
  },
  appTitleAccent: {
    color: "#6366f1",
  },
  scroll: { flex: 1 },
  offlineBannerWrapper: { paddingTop: 8 },
  sections: { gap: 32, paddingTop: 24, paddingBottom: 8 },
});
