import React from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { DetailHeader, DetailHeaderSkeleton } from "@/components/detail/DetailHeader";
import { OttProviders } from "@/components/detail/OttProviders";
import { ReviewSection } from "@/components/detail/ReviewSection";
import { ErrorView } from "@/components/shared/StateViews";
import { useContentDetail } from "@/hooks/useTmdb";
import { useFavoriteStatus, useFavoriteToggle } from "@/hooks/useFavorite";
import { useCurrentUser } from "@/store/authStore";
import type { MediaType } from "@/types/tmdb";
import type { TmdbMovieDetail, TmdbTvDetail } from "@/types/tmdb";

function isMovie(d: TmdbMovieDetail | TmdbTvDetail): d is TmdbMovieDetail {
  return "title" in d;
}

export default function DetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const contentId = Number(id);
  const mediaType = (type === "tv" ? "tv" : "movie") as MediaType;

  const user = useCurrentUser();

  const { data: detail, isLoading, isError, refetch } = useContentDetail(
    mediaType,
    contentId
  );

  const favoriteStatus = useFavoriteStatus(String(contentId), mediaType);
  const favoriteToggle = useFavoriteToggle(String(contentId), mediaType);

  function handleFavoriteToggle() {
    if (!user || !detail) return;
    const title = isMovie(detail) ? detail.title : detail.name;
    favoriteToggle.mutate({
      userId: user.id,
      contentId: String(contentId),
      contentType: mediaType,
      title,
      posterPath: detail.poster_path,
    });
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ScrollView>
          <DetailHeaderSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (isError || !detail) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ErrorView
          message="콘텐츠 정보를 불러오지 못했습니다."
          onRetry={refetch}
        />
      </View>
    );
  }

  const title = isMovie(detail) ? detail.title : detail.name;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더: 백드롭 + 포스터 + 메타 + 즐겨찾기 */}
        <DetailHeader
          detail={detail}
          isFavorited={favoriteStatus.data ?? false}
          isFavoritePending={favoriteToggle.isPending}
          onFavoriteToggle={handleFavoriteToggle}
        />

        <View style={styles.body}>
          {/* OTT 시청 가능 서비스 */}
          <OttProviders contentId={contentId} mediaType={mediaType} />

          <View style={styles.divider} />

          {/* 리뷰 섹션 */}
          <ReviewSection
            contentId={String(contentId)}
            contentType={mediaType}
            contentTitle={title}
            posterPath={detail.poster_path}
          />

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* 토스트 (OTT 딥링크 실패 안내 등) */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  centered: { justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  body: { gap: 24, paddingTop: 24 },
  divider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: "#1f2937",
  },
});
