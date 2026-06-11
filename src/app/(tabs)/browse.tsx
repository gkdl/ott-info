import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CachedImage } from "@/components/ui/CachedImage";
import { EmptyView, SectionError } from "@/components/shared/StateViews";
import { useBrowseByProvider } from "@/hooks/useTmdb";
import { useGenreList } from "@/hooks/useTmdb";
import {
  OTT_PROVIDERS,
  GENRE_OPTIONS,
  MEDIA_TYPE_TABS,
  type OttProvider,
} from "@/constants/ottProviders";
import type { MediaType } from "@/types/tmdb";
import type { TmdbContent, TmdbMovie, TmdbTv } from "@/types/tmdb";

function getItemInfo(item: TmdbContent, mediaType: MediaType) {
  const isMovie = mediaType === "movie" || "title" in item;
  const title = isMovie ? (item as TmdbMovie).title : (item as TmdbTv).name;
  return { title };
}

// ─── OTT 선택 칩 ─────────────────────────────────────────────────────────────

function OttChip({
  provider,
  selected,
  onPress,
}: {
  provider: OttProvider;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.ottChip,
        selected
          ? { backgroundColor: provider.color, borderColor: provider.color }
          : { borderColor: "#374151" },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.ottChipText,
          { color: selected ? provider.textColor : "#9ca3af" },
        ]}
      >
        {provider.name}
      </Text>
    </Pressable>
  );
}

// ─── 장르 칩 ─────────────────────────────────────────────────────────────────

function GenreChip({
  name,
  selected,
  onPress,
}: {
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.genreChip, selected && styles.genreChipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.genreChipText, selected && styles.genreChipTextSelected]}>
        {name}
      </Text>
    </Pressable>
  );
}

// ─── 콘텐츠 그리드 아이템 ────────────────────────────────────────────────────

function GridItem({
  item,
  mediaType,
}: {
  item: TmdbContent;
  mediaType: MediaType;
}) {
  const router = useRouter();
  const { title } = getItemInfo(item, mediaType);
  const itemMediaType = (item.media_type ?? mediaType) as MediaType;

  return (
    <Pressable
      style={styles.gridItem}
      onPress={() =>
        router.push({
          pathname: "/detail/[id]",
          params: { id: item.id, type: itemMediaType },
        })
      }
    >
      <View style={styles.posterWrapper}>
        <CachedImage path={item.poster_path} size="poster" style={styles.posterFill} />
      </View>
      <Text style={styles.gridTitle} numberOfLines={2}>
        {title}
      </Text>
      {item.vote_average > 0 && (
        <Text style={styles.gridRating}>★ {item.vote_average.toFixed(1)}</Text>
      )}
    </Pressable>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();

  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [selectedProvider, setSelectedProvider] = useState<OttProvider>(OTT_PROVIDERS[0]);
  const [selectedGenreId, setSelectedGenreId] = useState(0);

  const genres = GENRE_OPTIONS[mediaType];

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBrowseByProvider(mediaType, selectedProvider.id, selectedGenreId);

  const items = data?.pages.flatMap((p) => p.results) ?? [];

  function handleMediaTypeChange(mt: MediaType) {
    setMediaType(mt);
    setSelectedGenreId(0);
  }

  function handleProviderSelect(p: OttProvider) {
    setSelectedProvider(p);
    setSelectedGenreId(0);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── 헤더 ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>탐색</Text>

        {/* 영화 / 드라마 탭 */}
        <View style={styles.mediaTypeTabs}>
          {MEDIA_TYPE_TABS.map((tab) => (
            <Pressable
              key={tab.value}
              style={[
                styles.mediaTypeTab,
                mediaType === tab.value && styles.mediaTypeTabActive,
              ]}
              onPress={() => handleMediaTypeChange(tab.value)}
            >
              <Text
                style={[
                  styles.mediaTypeTabText,
                  mediaType === tab.value && styles.mediaTypeTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── OTT 선택 ──────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ottRow}
        style={styles.ottScroll}
      >
        {OTT_PROVIDERS.map((p) => (
          <OttChip
            key={p.id}
            provider={p}
            selected={selectedProvider.id === p.id}
            onPress={() => handleProviderSelect(p)}
          />
        ))}
      </ScrollView>

      {/* ── 장르 선택 ─────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.genreRow}
        style={styles.genreScroll}
      >
        {genres.map((g) => (
          <GenreChip
            key={g.id}
            name={g.name}
            selected={selectedGenreId === g.id}
            onPress={() => setSelectedGenreId(g.id)}
          />
        ))}
      </ScrollView>

      {/* ── 콘텐츠 결과 ──────────────────────────────────────────────── */}
      {isLoading ? (
        <ActivityIndicator color="#6366f1" style={styles.loader} />
      ) : isError ? (
        <SectionError onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyView
          emoji="🎬"
          title="콘텐츠가 없어요"
          description="다른 OTT 또는 장르를 선택해보세요."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#6366f1" style={{ padding: 16 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <GridItem item={item} mediaType={mediaType} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },

  // 헤더
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    color: "#f9fafb",
    fontSize: 22,
    fontWeight: "800",
  },
  mediaTypeTabs: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 3,
  },
  mediaTypeTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mediaTypeTabActive: {
    backgroundColor: "#6366f1",
  },
  mediaTypeTabText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },
  mediaTypeTabTextActive: {
    color: "#fff",
  },

  // OTT 칩
  ottScroll: { flexGrow: 0 },
  ottRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: "row",
  },
  ottChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  ottChipText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // 장르 칩
  genreScroll: { flexGrow: 0 },
  genreRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: "row",
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  genreChipSelected: {
    backgroundColor: "rgba(99,102,241,0.2)",
    borderColor: "#6366f1",
  },
  genreChipText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },
  genreChipTextSelected: {
    color: "#818cf8",
  },

  // 그리드
  loader: { marginTop: 60 },
  grid: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  gridRow: {
    gap: 8,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    gap: 6,
    maxWidth: "33.33%" as unknown as number,
  },
  posterWrapper: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  posterFill: {
    width: "100%" as unknown as number,
    height: "100%" as unknown as number,
  },
  gridTitle: {
    color: "#e5e7eb",
    fontSize: 11,
    lineHeight: 15,
  },
  gridRating: {
    color: "#fbbf24",
    fontSize: 10,
    fontWeight: "600",
  },
});
